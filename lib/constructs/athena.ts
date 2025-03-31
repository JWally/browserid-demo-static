import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as glue from "aws-cdk-lib/aws-glue";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as athena from "aws-cdk-lib/aws-athena";

export interface S3JsonTableProps {
  tableName: string;
  bucket: s3.IBucket;
  s3Prefix?: string;
  columns: { name: string; type: string }[];
  partitionKeys?: { name: string; type: string }[];
}

export interface AthenaDBConstructProps {
  stage: string;
  databaseName: string;
  queryResultsBucket: s3.IBucket;
  queryResultsPrefix?: string;
  tables: S3JsonTableProps[];
}

/**
 * AthenaDBConstruct creates:
 * - A Glue database (L1 resource)
 * - One or more Glue tables for JSON data stored in S3
 * - An Athena workgroup for query results
 */
export class AthenaConstruct extends Construct {
  public readonly databaseName: string;
  public readonly workGroup: athena.CfnWorkGroup;
  private readonly glueDatabase: glue.CfnDatabase;

  constructor(scope: Construct, id: string, props: AthenaDBConstructProps) {
    super(scope, id);

    // Create the Glue database.
    this.glueDatabase = new glue.CfnDatabase(
      this,
      `${props.databaseName}-glue-database`,
      {
        catalogId: cdk.Stack.of(this).account,
        databaseInput: {
          name: props.databaseName,
        },
      },
    );
    this.databaseName = props.databaseName;

    // Create an Athena workgroup with a query-results location.
    this.workGroup = new athena.CfnWorkGroup(
      this,
      `${props.databaseName}-athena-workgroup`,
      {
        name: `${props.databaseName}-wg`,
        recursiveDeleteOption: true,
        workGroupConfiguration: {
          publishCloudWatchMetricsEnabled: true,
          bytesScannedCutoffPerQuery: 1_000_000_000, // adjust as needed
          resultConfiguration: {
            outputLocation: `s3://${props.queryResultsBucket.bucketName}/${props.queryResultsPrefix ?? "athena-results"}/`,
          },
        },
      },
    );

    // Create each Glue table.
    props.tables.forEach((tableDef, index) => {
      const table = new glue.CfnTable(
        this,
        `${tableDef.tableName}-glue-table-${index}`,
        {
          catalogId: cdk.Stack.of(this).account,
          databaseName: props.databaseName,
          tableInput: {
            name: tableDef.tableName,
            tableType: "EXTERNAL_TABLE",
            parameters: {
              classification: "json",
            },
            storageDescriptor: {
              location: `s3://${tableDef.bucket.bucketName}/${tableDef.s3Prefix ?? ""}`,
              columns: tableDef.columns.map(
                (col) =>
                  ({
                    name: col.name,
                    type: col.type,
                  }) as glue.CfnTable.ColumnProperty,
              ),
              inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
              outputFormat:
                "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
              serdeInfo: {
                serializationLibrary: "org.openx.data.jsonserde.JsonSerDe",
                parameters: {
                  "ignore.malformed.json": "true",
                },
              },
            },
            partitionKeys: tableDef.partitionKeys
              ? tableDef.partitionKeys.map(
                  (pk) =>
                    ({
                      name: pk.name,
                      type: pk.type,
                    }) as glue.CfnTable.ColumnProperty,
                )
              : [],
          },
        },
      );
      // Ensure the Glue table is created only after the Glue database exists.
      table.node.addDependency(this.glueDatabase);
    });
  }
}
