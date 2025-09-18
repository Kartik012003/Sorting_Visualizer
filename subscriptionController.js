const Subscription = require("../models/subscription");
const User = require("../models/user");
const UserConfig = require("../models/userConfig");
const Service = require("../services/services");
const apiKey = process.env.API_KEY;
const payloadSecret = process.env.NODE_APP_PAYLOAD_SECURITY_KEY;

// method for fetching all process data
async function fetchSubscriptions(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);

    const { key } = decryptedData;
    // const { key } = req.body;

    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User .Contact to administrator.",
      });
    }

    const subscriptions = await Subscription.find();

    if (!subscriptions) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    res.status(201).json({ message: "All Subscription", subscriptions });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

// Method for fetching a single subscription by ID
async function fetchSubscriptionById(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { subscription_id, key } = decryptedPayload;
    // const { subscription_id, key } = req.body;

    if (!subscription_id) {
      return res.status(400).json({ message: "Subscription ID is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access. Contact the administrator.",
      });
    }

    const subscription = await Subscription.findById(subscription_id);

    if (!subscription) {
      return res.status(404).json({
        message: "Subscription not found.",
      });
    }

    return res.status(200).json({
      message: "Subscription fetched successfully.",
      subscription,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
}

// method for create subscription
async function createSubscription(req, res) {
  try {
    // console.log("request body:: ", req.body);

    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    // const { user_id, start_date, expiry_date, key, current_status, database,subscription_type,process_limit,generate_source,license_key,client_rule_engine,remark } =
    //   decryptedPayload;

    const {
      start_date,
      expiry_date,
      key,
      current_status,
      database,
      license_key,
      auto_update,
    } = decryptedPayload;

    // const { user_id, start_date, expiry_date, key, current_status, database,subscription_type,process_limit,generate_source,license_key,client_rule_engine,remark } = req.body;

    // if (!user_id) {
    //   return res.status(400).json({ message: "User Id is required." });
    // }

    // if (!database) {
    //   return res.status(400).json({ message: "Database is required." });
    // }

    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (!license_key) {
      return res.status(400).json({ message: "License_key Key  is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User .Contact to administrator.",
      });
    }
    // Check if the user already exists with the provided user id
    // const existUser = await User.findOne({ userid: user_id });
    const existingSubscription = await Subscription.findOne({
      license_key: license_key,
    });
    console.log("aleady exis; ", existingSubscription);
    if (existingSubscription) {
      return res.status(404).json({
        message: "Duplicate license_key.Please try again.",
      });
    }
    // const existDatabase = await UserConfig.findOne({ _id: database || "" });
    // if (existDatabase) {
    const newSubscription = new Subscription({
      user_id: "",
      user_name: "",
      // user_name: existUser.username,
      database_obj: "",
      database_url: "",
      database: "",
      start_date,
      expiry_date,
      current_status: current_status
        ? current_status
        : Service.isActiveSubscription(expiry_date),
      subscription_type: "",
      process_limit: 10,
      generate_source: "oflow",
      license_key,
      client_rule_engine: false,
      remark: "admin create subscriptions",
      auto_update,
    });
    const insertedData = await newSubscription.save();
    console.log("new inserted data::: ", insertedData);

    return res.status(201).json({
      message: "subscription created successfully.",
      subscription: newSubscription,
    });
    // } else {
    //   return res.status(404).json({
    //     message: "User not found.",
    //   });
    // }
  } catch (error) {
    console.error("Error creating suscription:", error);
    res.status(500).json({ message: "Internal server error" + error });
  }
}

// method for deleting subscription by ID
async function deleteSubscription(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { subscription_id, key } = decryptedPayload;
    // const { subscription_id, key } = req.body;

    if (!subscription_id) {
      return res.status(400).json({ message: "Subscription ID is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access. Contact the administrator.",
      });
    }

    // Find and delete the subscription
    const deletedSubscription = await Subscription.findByIdAndDelete(
      subscription_id
    );

    if (!deletedSubscription) {
      return res.status(404).json({
        message: "Subscription not found. Deletion failed.",
      });
    }

    return res.status(200).json({
      message: "Subscription deleted successfully.",
      deletedSubscription,
    });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
}

// Method for updating subscription by ID
async function updateSubscription(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    console.log(" *************udpatre request : ", decryptedPayload)
    const {
      subscription_id,
      start_date,
      expiry_date,
      user_name,
      key,
      current_status,
      database,
      license_key,
      auto_update,
    } = decryptedPayload;
    // const { subscription_id, start_date, expiry_date, user_name, key } = req.body;

    if (!subscription_id) {
      return res.status(400).json({ message: "Subscription ID is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access. Contact the administrator.",
      });
    }

    // Find subscription by ID
    const subscription = await Subscription.findById(subscription_id);

    if (!subscription) {
      return res.status(404).json({
        message: "Subscription not found. Update failed.",
      });
    }

    // Update fields
    subscription.start_date = start_date || subscription.start_date;
    subscription.expiry_date = expiry_date || subscription.expiry_date;
    subscription.user_name = user_name || subscription.user_name;
    subscription.database = database || subscription.database;
    subscription.auto_update = auto_update || subscription.auto_update;
    subscription.license_key = license_key || subscription.license_key;
    subscription.current_status = current_status
      ? current_status
      : Service.isActiveSubscription(expiry_date || subscription.expiry_date);
    subscription.auto_update = auto_update
    const updatedSubscription = await subscription.save();

    return res.status(200).json({
      message: "Subscription updated successfully.",
      updatedSubscription,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
}

module.exports = {
  createSubscription,
  fetchSubscriptions,
  fetchSubscriptionById,
  deleteSubscription,
  updateSubscription,
};
