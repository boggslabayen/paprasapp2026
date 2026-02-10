
const { S3Client } = require("@aws-sdk/client-s3");

console.log("REGION:", process.env.DO_SPACES_REGION);
console.log("ENDPOINT:", process.env.DO_SPACES_ENDPOINT);


const spacesClient = new S3Client({
  region: process.env.DO_SPACES_REGION,
  endpoint: process.env.DO_SPACES_ENDPOINT,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET
  }
});


module.exports = {
    spacesClient
}