const Configuration = require("../models/configuration");
console.log(">>> DEBUG: Configuration =", Configuration);
// const apiKey = process.env.API_KEY;
const apiKey = process.env.API_KEY;
const Service = require("../services/services");
const payloadSecret = process.env.NODE_APP_PAYLOAD_SECURITY_KEY;

// Save a new configuration
async function saveConfiguration(req, res) {
  try {
    // const encryptedData = req.body.data;
    // const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    // const {
    //   key,
    //   value,
    //   description,
    //   isActive,
    //   apikey: providedApiKey,
    // } = decryptedData;
    const {
      key,
      value,
      description,
      isActive,
      apikey: providedApiKey,
    } = req.body.data;

    if (!key) {
      return res.status(400).json({ message: "Key is required." });
    }

    if (providedApiKey !== apiKey) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    // Check for unique key
    const existingConfiguration = await Configuration.findOne({ key });
    if (existingConfiguration) {
      return res.status(409).json({ message: "Key already exists." });
    }

    const newConfig = new Configuration({ key, value, description, isActive });
    const savedConfig = await newConfig.save();

    res.status(201).json({
      message: "Configuration saved successfully.",
      configuration: savedConfig,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
}

// Update an existing configuration by key
async function updateConfig(req, res) {
  try {
    // const encryptedData = req.body.data;
    // const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    // const {
    //   key,
    //   value,
    //   description,
    //   isActive,
    //   apikey: providedApiKey,
    // } = decryptedData;
    const {
      key,
      value,
      description,
      isActive,
      apikey: providedApiKey,
    } = req.body.data;

    if (!key) {
      return res.status(400).json({ message: "Key is required for update." });
    }

    if (providedApiKey !== apiKey) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    // Find and update the configuration by key
    const updatedConfig = await Configuration.findOneAndUpdate(
      { key },
      { value, description, isActive },
      { new: true }
    );

    if (!updatedConfig) {
      return res
        .status(404)
        .json({ message: "Configuration with the given key not founnnnnnd." });
    }

    res.status(200).json({
      message: "Configuration updated successfully.",
      config: updatedConfig,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
}

// Fetch a configuration by key
async function fetchConfigByKey(req, res) {
  // console.log("request body:: ", req.body.data);

  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    const { key, apikey: providedApiKey } = decryptedData;
    // const { key, apikey: providedApiKey } = req.body.data;

    if (!key) {
      return res
        .status(400)
        .json({ message: "Key is required for fetching the configuration." });
    }

    if (providedApiKey !== apiKey) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    // Find the configuration by key
    const configuration = await Configuration.findOne({ key });

    if (!configuration) {
      return res
        .status(404)
        .json({ message: "Configuration with the given key not fo00000und." });
    }

    res.status(200).json({
      message: "Configuration fetched successfully.",
      configuration,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error. " + error.message });
  }
}

// Fetch all configurations
async function fetchAllConfigs(req, res) {
  try {
    // const encryptedData = req.body.data;
    // const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    // const { apikey: providedApiKey } = decryptedData;
    const { apikey: providedApiKey } = req.body.data;

    if (providedApiKey !== apiKey) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    const configs = await Configuration.find();

    res.status(200).json({
      message: "All configurations fetched successfully.",
      configs,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
}

// Delete a configuration by key
async function deleteConfigByKey(req, res) {
  try {
    // const encryptedData = req.body.data;
    // const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    // const { key, apiKey: providedApiKey } = decryptedData;
    const { key, apiKey: providedApiKey } = req.body.data;

    if (!key) {
      return res
        .status(400)
        .json({ message: "Key is required for deleting the configuration." });
    }

    if (providedApiKey !== apiKey) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    // Find and delete the configuration by key
    const deletedConfig = await Configuration.findOneAndDelete({ key });

    if (!deletedConfig) {
      return res.status(404).json({
        message: "Configuration with the given key not ffffffound. Deletion failed.",
      });
    }

    res.status(200).json({
      message: "Configuration deleted successfully.",
      deletedConfig,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error. " + error.message });
  }
}

module.exports = {
  saveConfiguration,
  updateConfig,
  fetchConfigByKey,
  fetchAllConfigs,
  deleteConfigByKey,
};
