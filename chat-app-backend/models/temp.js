const mongoose = require('mongoose')

const Schema = mongoose.Schema


const workflowSchema = new Schema({
	docId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'document',
		required: false,
	},
	title: { type: String, default: "workflow", required: false },
	admin: { type: Schema.Types.ObjectId, ref: 'user', required: false },
	corpId: { type: String, required: true },
	objective: { type: String, required: false },
	content_style: { type: String, required: false, default: "formal" },
	content_tone: { type: String, required: false, default: "creative" },
	status: { type: String, default: 'pending' }, // Status of the entire workflow
	tasks: [{
		name: { type: String, required: true },
		detail: { type: String, required: false },
		type: {
			type: String,
			enum: ['manual', 'bot', 'other'], // Add more types if needed
			required: true,
		},
		// Add any other fields you need for the task
		status: { type: String, default: 'pending' },
		message: [{
			user: { type: Schema.Types.ObjectId, required: false },
			createdAt: { type: Date, default: Date.now },
			comment: { type: String, default: "" },
			action: { type: String, default: "" },
		}],
		assignee: { type: Schema.Types.ObjectId, ref: 'user', required: false },

	}],
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

const Workflow = mongoose.model('workflow', workflowSchema);

exports.Workflow = Workflow;

// Create New Workflow
exports.createWorkflow = workflow => {
	const wf = new Workflow(workflow)
	return wf.save()
}


// Find Workflow by ID
exports.findWorkflowById = (id) => {
	return Workflow.findOne({ _id: id }).lean()
}


// Find workflow by DocID
exports.findWorkflowByDocId = (id) => {
	return Workflow.findOne({ docId: id }).lean()
}

// Find workflow by corpID
exports.findWorkflowByCorpId = (id) => {
	return Workflow.find({ corpId: id }).lean()
}

// get all workflow owned by me
exports.findWorkflowOwnedByUser = (userid) => {
	return Workflow.find({ admin: userid }).lean()
}

// get all workflow of users
exports.getUsersAllWorkflow = (userid) => {
	return Workflow.find({
		$or: [
			{ 'tasks': { $elemMatch: { 'assignee': userid } } },
			{ 'admin': userid }
		]
	}).lean()
}

// get all workflow in which I am a part of
exports.findWorkflowAssignedToUser = (userid) => {
	return Workflow.find({ 'tasks': { $elemMatch: { 'assignee': userid } } }).lean()
}

// To update workflow task and mark it as complete
exports.updateWorkflowTask = async (workflowId, taskId, status = true, message) => {
	return Workflow.findOneAndUpdate(
		{ _id: workflowId, 'tasks._id': taskId },
		// { $set: { 'tasks.$.status': 'done', 'tasks.$.message': message } },
		{ $set: { 'tasks.$.status': status }, $push: { 'tasks.$.message': message } },
		{ new: true }
	).lean()
}

// To update workflow task details
exports.updateWorkflowTaskDetails = async (workflowId, taskId, detail, status, assignee) => {
	return Workflow.findOneAndUpdate(
		{ _id: workflowId, 'tasks._id': taskId },
		// { $set: { 'tasks.$.status': 'done', 'tasks.$.message': message } },
		{ $set: { 'tasks.$.detail': detail, 'tasks.$.status': status, 'tasks.$.assignee': assignee } },
		{ new: true }
	).lean()
}

// Add doc ID to workflow
exports.updateDocIdInWorkflow = async (workflowId, docId) => {
	return Workflow.findOneAndUpdate(
		{ _id: workflowId },
		// { $set: { 'tasks.$.status': 'done', 'tasks.$.message': message } },
		{ $set: { 'docId': docId } },
		{ new: true }
	).lean()
}

// Update all previous task till last manual if any task is rejected
exports.updateTaskAfterRejection = async (workflowId, rejectedStepId, message) => {
	try {
		const workflow = await Workflow.findById(workflowId);
		if (!workflow) {
			throw new Error('Workflow not found');
		}

		const rejectedTaskIndex = workflow.tasks.findIndex((task) => task._id.toString() === rejectedStepId);

		if (rejectedTaskIndex === -1) {
			throw new Error('Task not found in workflow');
		}

		// Update tasks from the rejected task index until the last manual step
		for (let i = rejectedTaskIndex - 1; i >= 0; i--) {
			if (workflow.tasks[i].type === 'manual') {
				workflow.tasks[i].status = 'pending';
				break; // Stop updating tasks when we encounter the last manual step
			} else {
				workflow.tasks[i].status = 'pending';
			}
		}

		// Update Rejected Task with message
		// await workflow.updateWorkflowTask(workflowId, rejectedStepId, "rejected", message)
		workflow.task[rejectedTaskIndex].message.push(message)

		const result = await workflow.save();

		console.log(`Tasks after step ${rejectedStepId} marked as "pending"`);
		return result

	} catch (error) {
		console.log(error)
		console.error('Error marking tasks as "pending":', error.message);
		return false
	}
}

// add assignee to task
exports.addAssigneeToTask = (workflowId, taskId, newAssignee) => {
	return Workflow.findOneAndUpdate(
		{ _id: workflowId, 'tasks._id': taskId },
		//   { $push: { 'tasks.$.assignee': { user: newAssignee} } },
		{ $set: { 'tasks.$.assignee': newAssignee } },
		{ new: true }
	).lean();
};


// To get all users associated with any workflow
exports.getAllWorkflowUsers = async (workflowId) => {
	try {
		const pipeline = [
			{ $match: { _id: mongoose.Types.ObjectId(workflowId) } },
			{ $unwind: '$tasks' },
			{ $unwind: '$tasks.assignee' },
			{ $group: { _id: '$tasks.assignee.user' } }
		];

		const result = await Workflow.aggregate(pipeline);

		const userIDs = result.map(entry => entry._id.toString());

		return userIDs;
	} catch (error) {
		console.error('Error occurred:', error.message);
		return [];
	}
}

// Delete Workflow by ID
exports.deleteWorkflowById = (id) => {
	return Workflow.deleteOne({ _id: id }).lean()
}