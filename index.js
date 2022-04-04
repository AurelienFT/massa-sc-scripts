#!/usr/bin/env node

const run = (cmd) => {
    console.log(`Running ${cmd}...`);
    require('child_process').execSync(cmd, (_err, stdout, stderr) => {
        console.log(stdout);
        console.error(stderr);
    });
}

const bundle = (file) => {
    console.log(`Bundling ${file}...`);
    const fs = require("fs");
    const match = (x) => x.match(/include_base64\(["']+([\.a-z_\-\/\\ ]*)["']+\)[;]+/i);
    const lines = String(fs.readFileSync(file))
        .split("\n")
        .map((line) => {
            let res = match(line);
            if (res != null) {
                const data = fs.readFileSync(res[1], "base64");
                line = line.replace(res[0], JSON.stringify(data));
            }
            return line;
        });
    fs.writeFileSync(file.replace(".ts", ".m.ts"), lines.join("\n"), { flag: "w+" });
};

const BUILD_DEFAULTS = {
    input: "src/smart-contract.ts",
    output: "build/smart-contract.wasm",
};

const COMPILER_OPTIONS = "--target release --exportRuntime";

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
                        argv.input == BUILD_DEFAULTS.output
                    ) {
                        return `build/${require("path").parse(argv.input).name}.wasm`;
                    }
                    return argv.output;
                })(argv)}`
            )
    )
    .command("bundle", "", () => {
        bundle(`${process.cwd()}/src/main.ts`);
        run(`asc src/main.m.ts ${COMPILER_OPTIONS} --binaryFile build/main.wasm`);
        run("rm src/main.m.ts");
    })
    .command("clean", "", () => run(`rm -rf assembly/*.m.ts build ledger.json`))
    .help().argv;
