const Odoo = require('../models/odoo');
// const bcrypt = require('bcrypt');
// const Schema = mongoose.Schema;
const Service = require('../services/services');


async function validateOdooData(req, res) {
    try {
        const {process_id, user_id} = req.body;
        console.log("we are in odoo ", req.body, " parmas : ",req.params, "query",req.query)
        if(req.query.process_id === '')
        {
            return res.status(400).json({ message: 'Either Process id or User id is required.' }); 
        }
        const odoo = await Odoo.find({process_id: String(req.query.process_id)});
        if (!odoo || odoo.length === 0) {
            return res.status(404).json({ message: 'No Odoo data found for this process Id' });
        }
        res.status(201).json({ odoo});
    } catch (error) {
        res.status(500).json({ message: 'Internal server error .' + error });
    }
}



async function createOdooProcess(req, res) {
     try {
        const {process_id, user_id} = req.body;
        if(process_id ==='')
        {
            return res.status(400).json({ message: 'Process ID is required.' });    
        }
        if(user_id ==='')
        {
            return res.status(400).json({ message: 'User Id is required.' });    
        }
        // Check if the user already exists with the provided email or username
        const existProcess = await Process.findOne({ $or: [{ process_name }] });
        if (existProcess) {
            console.log("existing user : ", existProcess)
            return res.status(200).json({ message: 'Process already exists .Please ensure to enter Process Name unique.' });
        }
        dynamic_process_id = Service.generate_process_key(req.body)
        const newProcess = new Process({ process_id: dynamic_process_id, process_name, process_detail, user_id ,process_data_flow:"",process_data_form:""});

        await newProcess.save();
        res.status(201).json({ message: 'Process created successfully', process: newProcess });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' + error });
    }
}

// async function getProcessesByUserId(req, res) {
//     try {
//         const { user_id } = req.params; // Assuming user_id is passed as a URL parameter
//         const processes = await Process.find({user_id: String(user_id)});
//         if (!processes || processes.length === 0) {
//             return res.status(404).json({ error: 'No processes found for this user' });
//         }
//         res.status(201).json({ processes});
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' + error });
//     }
// }

// async function updateProcess(req , res) {
//     try{
//             const { process_id, user_id } = req.body;
//             console.log("full request body: ", req.body)
//             const filter = { process_id: process_id ,user_id: user_id}; 
//             const update = { process_data_flow: req.body.process_data_flow,process_data_form:req.body.process_data_form} 
//             const options = { new: true }; 
//             const updateProcess = await Process.findOneAndUpdate(filter, update, options);
//             if(!updateProcess){
//                 return res.status(404).json({ error: 'Process not found.' });
//             }        
//         res.status(201).json({ message: 'Process Updated successfully with data flow.', updateProcess });
//         }
//     catch (error) {
//         res.status(500).json({ error: 'Internal server error' + error });
//     }
// }

// async function deleteProcess(req , res) {
//     try{
//             const { process_id, user_id } = req.body;
//             console.log("full request body: ", req.body)
//             const filter = { process_id: process_id ,user_id: user_id}; 
//             const result = await Process.deleteOne(filter);
//             if (result.deletedCount === 1) {
//             console.log('Successfully deleted one document.');
//             res.status(201).json({ message: 'Specefied Process is deleted.', updateProcess });
//             }
//             else {
//             console.log('No documents matched the query. Deleted 0 documents.');
//             res.status(201).json({ message: 'No process matched . Deleted 0 process.', updateProcess });
//             }      
//         }
//     catch (error) {
//         res.status(500).json({ error: 'Internal server error' + error });
//     }
// }

module.exports = {
    validateOdooData, 
    createOdooProcess,
};
