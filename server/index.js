const express = require("express");
const axios = require("axios");
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
// const characterCodes = require("./characters.json");

const app = express();

const port = 3030;

app.use(express.json());

const getSecret = async () => {
   const secretName = ["Vestaboard-API-Secret", "Vestaboard-RW-API-Key"];

   // Authenticate to Azure
   const credential = new DefaultAzureCredential();

   // Create SecretClient
   const vaultName = "kv-vestaboard-use2-dev";
   const url = `https://${vaultName}.vault.azure.net`;
   const client = new SecretClient(url, credential);

   // Get secrets concurrently
   const secretPromises = await Promise.all(
      secretName.map(async (val) => (await client.getSecret(val)).value)
   );

   return {
      VestaboardAPISecret: secretPromises[0],
      VestaboardRWAPIKey: secretPromises[1],
   };
};

app.get("/", async (req, res) => {
   try {
      const secrets = await getSecret();

      const readVestaBoard = await axios.get("https://rw.vestaboard.com/", {
         headers: {
            "Content-Type": "application/json",
            "X-Vestaboard-Read-Write-Key": secrets.VestaboardRWAPIKey,
         },
      });

      //parsing json & converting into an array
      const data = Object.values(
         JSON.parse(readVestaBoard.data.currentMessage.layout)
      );

      data.map((i) => {
         console.log(i);
      });

      res.status(200).json({ message: "Data retrieved successfully" });
   } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal server error" });
   }
});

app.listen(port, () => {
   console.log(`Listening on port:${port}...`);
});
