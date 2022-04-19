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
    output: "build/smart-contract.wasm",
};

const COMPILER_OPTIONS = "--transform mscl-as-transformer --transform json-as/transform --target release --exportRuntime";

require("yargs").scriptName("massa-sc-scripts")
    .usage("$0 <cmd> [args]")
    .command(
        "build [input] [output]",
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
    .command("clean", "", () => run(`rm -rf assembly/*.m.ts build ledger.json`))
    .help().argv;
