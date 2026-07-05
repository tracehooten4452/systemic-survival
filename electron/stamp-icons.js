const fs = require("node:fs");
const path = require("node:path");
const { rcedit } = require("rcedit");

const root = path.join(__dirname, "..");
const pkg = require(path.join(root, "package.json"));
const icon = path.join(root, "assets", "systemic-survival-icon.ico");

const targets = [
  path.join(root, "dist", "win-unpacked", `${pkg.build.productName}.exe`)
];

async function main() {
  for (const target of targets) {
    if (!fs.existsSync(target)) {
      throw new Error(`Icon target missing: ${target}`);
    }

    await rcedit(target, { icon });
    console.log(`stamped icon: ${path.relative(root, target)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
