const { json } = require("express");
const Group = require("../models/groupModal");
const Service = require("../services/services");
const UserConfig = require("../models/userConfig");
const baseUrl = process.env.ODOO_BASE_URL;
const apiKey = process.env.API_KEY;
const payloadSecret = process.env.NODE_APP_PAYLOAD_SECURITY_KEY;

async function getGroupsByUserId(req, res) {
  try {
    const { user_id } = req.params; // Assuming user_id is passed as a URL parameter
    const groups = await Group.find(
      { user_id: String(user_id) }
      // {
      //   group_id: 1,
      //   group_name: 1,
      //   category_id: 1,
      //   category_name: 1,
      //   group_internal: 1,
      //   database: 1,
      //   database_obj: 1,
      // }
    );
    if (!groups || groups.length === 0) {
      return res.status(404).json({ message: "No groups found for this user" });
    }
    res.status(201).json({ groups });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

async function createGroup(req, res) {
  try {
    const { encryptedData } = req.body;

    if (!encryptedData) {
      return res.status(400).json({ message: "Missing encrypted data." });
    }

    // Decrypt the data
    const decryptedBody = Service.decryptData(encryptedData, payloadSecret);
    console.log("Decrypted request body:", decryptedBody);

    const {
      group_database,
      group_type,
      group_id,
      group_name,
      category_id,
      category_name,
      group_data,
      user_id,
      sub_group,
    } = decryptedBody;
    console.log("base url: ", baseUrl);
    console.log("apiKey: ", apiKey);
    console.log("req.body createGroup: ", decryptedBody);
    // console.log("req.body createGroup: ", req.body);
    // const {group_database,group_type, group_id, group_name, category_id, category_name, group_data, user_id,sub_group } = req.body;
    // Validate input
    if (!group_database) {
      return res.status(400).json({ message: "Database is not selected." });
    }
    if (!group_type) {
      return res.status(400).json({ message: "Group type is required." });
    }
    if (!group_name) {
      return res.status(400).json({ message: "Group Name is required." });
    }
    // if (!category_name) {
    //     return res.status(400).json({ message: 'Category Name is required.' });
    // }
    if (!user_id) {
      return res.status(400).json({ message: "User Id is required.gc1" });
    }
    let response_status = "";
    let response_data = "";
    let response_state = "500";
    // start fetching current instance database url
    const existConfig = await UserConfig.findOne({
      $and: [
        { userid: user_id },
        { _id: group_database.trim() },
        { isactive: true },
      ],
    });
    console.log("Existing configuration: ", existConfig);
    if (!existConfig) {
      return res.status(400).json({ message: "Configuration is not active" });
    }
    let odooBaseUrl = existConfig.parameter; // from current database
    // end here

    if (group_type === "new") {
      const create_end_point = "/o2b/create_group_category";
      // const apiUrl = `${baseUrl}${create_end_point}`; from env. file
      const apiUrl = `${odooBaseUrl}${create_end_point}`;
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(decryptedBody),
          // body: JSON.stringify(req.body),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response data", data);

        // Parse the result if it's a JSON string
        let result;
        try {
          result = JSON.parse(data.result);
        } catch (e) {
          console.error("Error parsing result:", e);
          result = {};
        }
        if (result.status === true) {
          const existgroup = await Group.findOne({
            group_name: result.group_name,
            user_id: user_id,
          });
          if (existgroup) {
            return res.status(200).json({
              error:
                "Group already exists. Please ensure to enter a unique Group Name.",
              status: 401,
            });
          }
          const newGroup = new Group({
            group_type: result.group_type,
            group_id: result.group_id,
            group_name: result.group_name,
            group_internal: result.internal_name,
            category_id: result.category_id,
            category_name: result.category_name,
            user_id,
            database:
              existConfig.configname + " (" + existConfig.database + ")",
            database_obj: existConfig._id,
            database_url: existConfig.parameter,
            sub_group,
          });

          console.log("new group in mongodb: ", newGroup);
          await newGroup.save();
          return res
            .status(201)
            .json({ message: "Group created successfully", group: newGroup });
        } else {
          console.log("data.status in else block", result.status);
          return res.status(500).json({ message: "Internal server error." });
        }
      } catch (error) {
        console.error("Error while calling create group category:", error);
        return res
          .status(500)
          .json({ message: "Failed to create group category." });
      }
    }

    if (group_type === "existing") {
      console.log("We are in existing data: ");

      if (!group_name || !category_name) {
        return res
          .status(400)
          .json({ message: "Required Fields: Group Name,  Category Name" });
      }

      // Check if the group already exists
      const existgroup = await Group.findOne({
        group_name: group_name,
        user_id: user_id,
      });
      if (existgroup) {
        console.log("existing user: ", existgroup);
        return res.status(202).json({
          message:
            "Group already exists. Please ensure to enter a unique Group Name.",
          status: 401,
        });
      }

      // Create a new group
      const newGroup = new Group({
        group_type,
        group_id,
        group_name,
        category_id,
        category_name,
        group_data,
        user_id,
        database: existConfig.configname + " (" + existConfig.database + ")",
        database_obj: existConfig._id,
        database_url: existConfig.parameter,
        sub_group,
      });
      console.log("new group in mongodb: ", newGroup);
      await newGroup.save();
      return res
        .status(201)
        .json({ message: "Group created successfully", group: newGroup });
    }
    // Respond based on the status
    if (response_status === true && response_state === "200") {
      res.status(201).json({ message: response_data });
    } else {
      res.status(500).json({ message: response_data });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
}

// async function createGroup(req, res) {
//     try {
//         console.log("base url: ", baseUrl);
//         console.log("apiKey: ", apiKey);
//         console.log("req.body createGroup: ", req.body);
//         const {group_database,group_type, group_id, group_name, category_id, category_name, group_data, user_id } = req.body;
//         // Validate input
//         if (!group_database) {
//             return res.status(400).json({ message: 'Database is not selected.' });
//         }
//         if (!group_type) {
//             return res.status(400).json({ message: 'Group type is required.' });
//         }
//         if (!group_name) {
//             return res.status(400).json({ message: 'Group Name is required.' });
//         }
//         if (!category_name) {
//             return res.status(400).json({ message: 'Category Name is required.' });
//         }
//         if (!user_id) {
//             return res.status(400).json({ message: 'User Id is required.' });
//         }
//         let response_status = '';
//         let response_data = '';
//         let response_state = '500';
//         // start fetching current instance database url
//         const existConfig = await UserConfig.findOne({ $and: [{ userid:user_id  }, { _id:group_database.trim()},{isactive:true}] });
//         console.log("Existing configuration: ", existConfig);
//         if (!existConfig) {
//         return res.status(400).json({ message: 'Configuration is not active' });
//         }
//         let odooBaseUrl = existConfig.parameter   // from current database
//         // end here

//         if (group_type === 'new') {
//             const create_end_point = '/o2b/create_group_category';
//             // const apiUrl = `${baseUrl}${create_end_point}`; from env. file
//             const apiUrl = `${odooBaseUrl}${create_end_point}`;
//             try {
//                 const response = await fetch(apiUrl, {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify(req.body),
//                 });

//                 if (!response.ok) {
//                     throw new Error(`HTTP error! status: ${response.status}`);
//                 }

//                 const data = await response.json();
//                 console.log('Response data', data);

//                 // Parse the result if it's a JSON string
//                 let result;
//                 try {
//                     result = JSON.parse(data.result);
//                 } catch (e) {
//                     console.error('Error parsing result:', e);
//                     result = {};
//                 }

//                 if (result.status === true) {
//                     const existgroup = await Group.findOne({ group_name: result.group_name, user_id: user_id });
//                     if (existgroup) {
//                         return res.status(200).json({ error: 'Group already exists. Please ensure to enter a unique Group Name.' ,status:401});
//                     }
//                     const newGroup = new Group({
//                         group_type: result.group_type,
//                         group_id: result.group_id,
//                         group_name: result.group_name,
//                         group_internal: result.internal_name,
//                         category_id: result.category_id,
//                         category_name: result.category_name,
//                         user_id,
//                         database: existConfig.configname + ' (' + existConfig.database + ')',
//                         database_obj: existConfig._id,
//                         database_url:existConfig.parameter
//                     });

//                     console.log("new group in mongodb: ", newGroup);
//                     await newGroup.save();

//                     // response_status = result.status;
//                     // response_data = `Group created successfully: Group: ${newGroup}`;
//                     // response_state = '200';
//                     return res.status(201).json({ message: 'Group created successfully', group: newGroup });
//                 } else {
//                     // response_status = result.status;
//                     // response_data = 'Error while creating group.';
//                     // response_state = '500';
//                     console.log("data.status in else block", result.status);
//                     return res.status(500).json({ message: 'Internal server error.'});
//                 }
//             } catch (error) {
//                 console.error('Error while calling create group category:', error);
//                 return res.status(500).json({ message: 'Failed to create group category.' });
//             }
//         }

//         if (group_type === 'existing') {
//             console.log("We are in existing data: ");

//             if (!group_name ||  !category_name) {
//                 return res.status(400).json({ message: 'Required Fields: Group Name,  Category Name' });
//             }

//             // Check if the group already exists
//             const existgroup = await Group.findOne({ group_name: group_name, user_id: user_id });
//             if (existgroup) {
//                 console.log("existing user: ", existgroup);
//                 return res.status(202).json({ message: 'Group already exists. Please ensure to enter a unique Group Name.',status:401 });
//             }

//             // Create a new group
//             const newGroup = new Group({
//                         group_type,
//                         group_id,
//                         group_name,
//                         category_id,
//                         category_name,
//                         group_data,
//                         user_id,
//                         database: existConfig.configname + ' (' + existConfig.database + ')',
//                         database_obj: existConfig._id,
//                         database_url:existConfig.parameter
//                         });
//             console.log("new group in mongodb: ", newGroup);
//             await newGroup.save();
//             return res.status(201).json({ message: 'Group created successfully', group: newGroup });
//         }
//         // Respond based on the status
//         if (response_status === true && response_state === '200') {
//             res.status(201).json({ message: response_data });
//         } else {
//             res.status(500).json({ message: response_data });
//         }
//     } catch (error) {
//         res.status(500).json({ message: 'Internal server error: ' + error.message });
//     }
// }
// working code for delete old
// async function deleteGroup(req, res) {
//     try {
//         const {group_id , user_id, key } = req.body;

//         // Validate input
//         if (!user_id) {
//             return res.status(400).json({ message: 'User Id is required.' });
//         }
//         if (!group_id) {
//             return res.status(400).json({ message: 'Group  Id is required.' });
//         }

//         if (!key) {
//             return res.status(400).json({ message: 'Access Key is required.' });
//             }

//         if (key!=apiKey) {
//             return res.status(400).json({ message: 'Unauthorized access User contact to administrator.' });
//             }

//         const existgroup = await Group.findOne({ _id:group_id ,user_id });
//         console.log(" ** yes group is found : ", existgroup)
//         console.log("fdfdf")
//         if(existgroup){
//             const { group_name,database_url } = existgroup;
//             const create_end_point = '/o2b/delete_group_category';
//             const apiUrl = `${database_url}${create_end_point}`;
//             console.log("Current hit API:", apiUrl);
//             try {
//                 const response = await fetch(apiUrl, {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify({ group_name }),
//                 });
//                 const data = await response.json();
//                 console.log('Response data:', data);
//                 const result = JSON.parse(data.result);
//                 const filter = { _id : group_id ,user_id,  };
//                 const result1 = await Group.findOneAndDelete(filter);
//                 if (!result1)
//                 {
//                     return res.status(404).json({ error: 'No configuration found for this user ID with the given criteria.' });
//                 }
//                 res.status(200).json({ message: 'User Group  deleted successfully.' });
//             } catch (error) {
//                     console.error('Error while delete groups:', error);
//                     return res.status(500).json({ message: 'Failed to delete group.' + error.message });
//                 }
//         }
//     } catch (error) {
//         res.status(500).json({ message: 'Internal server error: ' + error.message });
//     }
// }
// new code for delete group


async function deleteGroup(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);

    const { group_id, user_id, key } = decryptedPayload;
    // const {group_id , user_id, key } = req.body;

    // Validate input
    if (!user_id) {
      return res.status(400).json({ message: "User Id is required kartik." });
    }
    if (!group_id) {
      return res.status(400).json({ message: "Group  Id is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User contact to administrator.",
      });
    }

    const existgroup = await Group.findOne({ _id: group_id, user_id });
    console.log(" ** yes group is found : ", existgroup);
    console.log("fdfdf");
    if (existgroup) {
      const { group_name, database_url } = existgroup;
      const create_end_point = "/o2b/delete_group_category";
      const apiUrl = `${database_url}${create_end_point}`;
      console.log("Current hit API:", apiUrl);
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ group_name }),
        });
        const data = await response.json();
        console.log("Response data:", data);
        const result = JSON.parse(data.result);
        const filter = { _id: group_id, user_id };
        const result1 = await Group.findOneAndDelete(filter);
        if (!result1) {
          return res.status(404).json({
            error:
              "No configuration found for this user ID with the given criteria.",
          });
        }
        res.status(200).json({ message: "User Group  deleted successfully." });
      } catch (error) {
        console.error("Error while delete groups:", error);
        return res
          .status(500)
          .json({ message: "Failed to delete group." + error.message });
      }
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
}
module.exports = {
  createGroup,
  getGroupsByUserId,
  deleteGroup,
};

