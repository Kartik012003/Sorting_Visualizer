const DecisionTable = require("../models/processDecision_table");
const Storage = require("../models/storage");
const Service = require("../services/services");
const Config = require("../models/userConfig");
const apiKey = process.env.API_KEY;
const payloadSecret = process.env.NODE_APP_PAYLOAD_SECURITY_KEY;
const baseUrl = process.env.LEAD_POST_URL;
const crypto = require("crypto");

// *********fetch decision rule engine controller via backend start 
async function fetchDecisionRule(req, res) {
    try {
        const {process_id, process_name,api_key,curr_name,curr_id} = req.body;
        if(!process_id)
        {
            return res.status(400).json({ message: 'Process is required.' });
        }
        // Check if the user already exists with the provided email or username
        const processDecsionRecords = await DecisionTable.find({ process_id: process_id , curr_name: curr_name ,curr_id: curr_id });
        console.log("lenth of record: ", processDecsionRecords.length)

        if (processDecsionRecords && processDecsionRecords.length > 0) {
            return res.status(200).json({ message: processDecsionRecords  });
        }
        else{
          return res.status(404).json({ message:'NOT_FOUND'});
        }
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error' + error });
    }
}

module.exports = {
  fetchDecisionRule,
  
};
