const CustomModelField = require("../models/customModelField");
const Service = require("../services/services");
const apiKey = process.env.API_KEY;
const payloadSecret = process.env.NODE_APP_PAYLOAD_SECURITY_KEY;

// Method to fetch all records
async function fetchCustomModelFields(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    const { key, user_id } = decryptedData;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required.cmf1" });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key !== apiKey) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const fields = await CustomModelField.find();
    res
      .status(200)
      .json({ message: "All fields fetched successfully.", fields });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
}

// Method to fetch a single record by ID
async function fetchCustomModelFieldById(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    const { field_id, key, user_id } = decryptedData;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required.cmf2" });
    }

    if (!field_id) {
      return res.status(400).json({ message: "Field ID is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key !== apiKey) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const field = await CustomModelField.findById(field_id);
    if (!field) {
      return res.status(404).json({ message: "Field not found." });
    }

    res.status(200).json({ message: "Field fetched successfully.", field });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
}

// Method to create a new record
async function createCustomModelField(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    const { name, type, key, user_id } = decryptedData;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required.cmf3" });
    }

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key !== apiKey) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const newField = new CustomModelField({ name, type });
    const savedField = await newField.save();

    res
      .status(201)
      .json({ message: "Field created successfully.", field: savedField });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
}

// Method to update a record by ID
async function updateCustomModelField(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    const { field_id, name, type, key, user_id } = decryptedData;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required.cmf4" });
    }

    if (!field_id) {
      return res.status(400).json({ message: "Field ID is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key !== apiKey) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const field = await CustomModelField.findById(field_id);
    if (!field) {
      return res.status(404).json({ message: "Field not found." });
    }

    field.name = name || field.name;
    field.type = type || field.type;
    const updatedField = await field.save();

    res
      .status(200)
      .json({ message: "Field updated successfully.", field: updatedField });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
}

// Method to delete a record by ID
async function deleteCustomModelField(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    const { field_id, key, user_id } = decryptedData;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required.cmf5" });
    }

    if (!field_id) {
      return res.status(400).json({ message: "Field ID is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key !== apiKey) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const deletedField = await CustomModelField.findByIdAndDelete(field_id);
    if (!deletedField) {
      return res.status(404).json({ message: "Field not found." });
    }

    res
      .status(200)
      .json({ message: "Field deleted successfully.", field: deletedField });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
}

module.exports = {
  fetchCustomModelFields,
  fetchCustomModelFieldById,
  createCustomModelField,
  updateCustomModelField,
  deleteCustomModelField,
};
