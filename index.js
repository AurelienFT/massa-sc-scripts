#!/usr/bin/env node

const run = (cmd) => {
    console.log(`Running ${cmd}...`);
    require('child_process').execSync(cmd, (_err, stdout, stderr) => {
        console.log(stdout);
        console.error(stderr);
    });
}

const BUILD_DEFAULTS = {
    input: "src/smart-contract.ts",
    input_zip: "site.zip",
    output: "build/smart-contract.wasm",
    output_zip: "website.zip",
};

const COMPILER_OPTIONS = "--transform mscl-as-transformer --transform json-as/transform --target release --exportRuntime";

require("yargs").scriptName("massa-sc-scripts")
    .usage("$0 <cmd> [args]")
    .command(
        "build-sc [input] [output]",
        "",
        (yargs) => {
            yargs.positional("input", {
                type: "string",
                default: BUILD_DEFAULTS.input,
            });
            yargs.positional("output", {
                type: "string",
                default: BUILD_DEFAULTS.output,
            });
        },
        (argv) =>
            run(
                `asc ${argv.input} ${COMPILER_OPTIONS} --binaryFile ${((argv) => {
                    if (
                        argv.input != BUILD_DEFAULTS.input &&
                        argv.output == BUILD_DEFAULTS.output
                    ) {
                        return `build/${require("path").parse(argv.input).name}.wasm`;
                    }
                    return argv.output;
                })(argv)}`
            )
    )
    .command(
        "build-website-sc [zip_of_website] [output]",
        "",
        (yargs) => {
            yargs.positional("zip_of_website", {
                type: "string",
                default: BUILD_DEFAULTS.input,
            });
            yargs.positional("output", {
                type: "string",
                default: BUILD_DEFAULTS.output,
            });
        },
        (argv) =>
        run(`echo "import { include_base64, print, Storage } from 'massa-sc-std';

            function createWebsite(): void {
                const bytes = include_base64('${argv.zip_of_website}');
                Storage.set_data('massa_web', bytes);
            }
            
            export function main(_args: string): i32 {
                createWebsite();
                print('Uploaded site');
                return 0;
            }" > website.ts && massa-sc-scripts build-sc website.ts ${argv.output} && rm website.ts`
        ),
    )
    .command("clean", "", () => run(`rm -rf assembly/*.m.ts build ledger.json`))
    .help().argv;
