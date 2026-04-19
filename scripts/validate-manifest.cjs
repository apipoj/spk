// spk/scripts/validate-manifest.cjs
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const schema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'schemas', 'manifest.schema.json'), 'utf-8')
);

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

function validateManifest(manifest) {
  const valid = validate(manifest);
  return {
    valid,
    errors: valid ? [] : validate.errors.map(e => `${e.instancePath} ${e.message}`)
  };
}

function main() {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('manifest.json not found');
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const result = validateManifest(manifest);
  if (!result.valid) {
    console.error('manifest.json is invalid:');
    result.errors.forEach(e => console.error('  -', e));
    process.exit(1);
  }
  console.log('manifest.json is valid');
}

if (require.main === module) main();

module.exports = { validateManifest };
