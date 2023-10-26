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


const mongoose = require('mongoose')
const { getUTCDate } = require('../../helpers/dateUtils')
const Schema = mongoose.Schema

var docSchema = new Schema({
	userid: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'users',
		required: true,
	},
	title: { type: String, max: 255 },
	isDeleted: { type: String, default: '0' },
	sharedWA: { type: Number, default: 0 },
	sharedFB: { type: Number, default: 0 },
	sharedLI: { type: Number, default: 0 },
	sharedEML: { type: Number, default: 0 },
	sharedTWT: { type: Number, default: 0 },
	created_date: Date,
	updated_date: Date,
	preferences: {
		type: String,
		enum: ['personal', 'review', 'healthcare', 'science'],
	},
	blocks: [
		{
			original: { type: String },
			modified: { type: String },
			emotional: { type: Boolean, default: false },
			emotional_score: [{ type: String, default: '0' }],
			factual: { type: Boolean, default: false },
			factual_score: [{ type: String, default: '0' }],

			isDeleted: { type: Boolean, default: false },

			isNewBlock: { type: Boolean, default: false },

			toxicity: [{
				name: String,
				values: [Number]
			}],

			positivity: [{ type: Number, max: 9.99 }],
			isAbusive: [{ type: Boolean, default: false }],
			offenders: [{ type: String, default: '' }],
			abusiveIgnoreList: [{ type: String, default: '' }],
			htmlType: { type: String, default: 'text' },

			collaboratorComments: [
				{
					root: { type: String, default: '' },
					userid: {
						type: mongoose.Schema.Types.ObjectId,
						ref: 'users',
						required: false
					},
					comment: { type: String, default: '' },
					created_at: {
						type: Date,
						default: Date.now
					},
				}
			],

			documentQuality: {
				readScore: [{ type: Number, default: 0.0 }],
				repetitiveness: { type: Number, default: 0.0 },
				uniqueness: { type: Number, default: 0.0 },
				connectives: { type: Number, default: 0.0 },
			},
			sentences: [
				{
					text: { type: String, default: "" },
					formattedText: { type: String, default: "" }
				}
			]
		},
	],
	Emotions: {
		document: {
			type: [{
				name: String,
				value: Number,
				index: Number
			}]
		},
		blocks: [{
			sentiment: String,
			value: [{
				block: Number,
				sentence: Number,
				score: Number
			}]
		}]
	},
	toxicity: {
		document: [{
			name: String,
			value: Number,
		}]
	},
	intent: [{ type: String }],
	plagiarism_score: { type: Number, default: 0.0 },
	emotional: { type: String },
	factual: { type: String },
	AbusiveContent: { type: String, default: 'na' },
	generated_topic: { type: String, default: 'na' },
	summary: { type: String, default: 'na' },
	avgPositivity: { type: Number, default: 0.0 },
	documentQuality: {
		readTime: { type: String, default: "1 min read" },
		readScore: { type: Number, default: 0.0 },
		repetitiveness: { type: Number, default: 0.0 },
		uniqueness: { type: Number, default: 0.0 },
		connectives: { type: Number, default: 0.0 },
	},
	sentencesLen: {
		type: Number,
		default: function () {
			let totalSentences = 0;
			this.blocks.forEach((blocks) => {
				totalSentences += blocks.sentences.length;
			});
			return totalSentences;
		},
	},
	blocksLen: {
		type: Number,
		default: function () {
			return this.blocks.length
		},
	},
	category: {
		type: String,
		enum: ['Technology', 'Politics', 'Entertainment', 'Relationship and Social', 'Healthcare', 'Communication', 'Soft skills', 'Cooking and Cuisines', 'Fashion and Lifestyle', 'Tour and Travel', 'Finance and Economics', 'Authoring', 'Health and Fitness', 'Sports', 'Photography'],
		default: 'Communication'
	},
	type: { type: String, default: 'classic' },
	visibility: { type: String, default: 'private' },
	documentImage: { type: String },
	slugId: { type: String },
	isCollaborated: { type: Boolean, default: false },
	collaborators: [{
		userid: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'users',
			required: true,
			unique: true
		},
		_id: false,
		status: { type: String, default: "requested" },
		deadline: { type: Date }
	}],
	originalDoc: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'documents',
	},
	isCopy: { type: Boolean, default: false },
	collaborationStatus: {
		userid: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'users',
			required: false
		},
		_id: false,
		status: { type: Boolean, default: false },
		removeRequest: { type: Boolean, default: false },
		nextEditor: {
			userid: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'users',
				required: false
			},
			deadline: { type: Date }
		}
	},
	currentEditor: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: function () { return this.userid } },
	originalEditor: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: function () { return this.userid } }
})


const Document = mongoose.model('document', docSchema)
exports.Document = Document

exports.createDocument = doc => {
	const document = new Document(doc)
	const time = getUTCDate()
	const rand = +Math.random() + time
	document['created_date'] = time
	document['updated_date'] = time
	document['slugId'] = Buffer.from(rand.substr(2), 'hex').toString('base64').replace(/[/=]/g, "")
	return document.save()
}
exports.getDocumentCount = userId => {
	return new Promise((resolve, reject) => {
		Document.countDocuments({ userid: userId }, function (err, count) {
			if (err) {
				console.log('Error Getting Document Count : ', err)
				reject(err)
			} else {
				resolve(count)
			}
		})
	})
}

exports.getAllDocuments = (userId, page, limit, deleted = 0) => {
	return new Promise((resolve, reject) => {
		// Document.find(
		//   { userid: mongoose.Types.ObjectId(userId), isDeleted: deleted },
		//   [
		//     '_id',
		//     'updated_date',
		//     'created_date',
		//     'title',
		//     'isDeleted',
		//     'preferences',
		//     // 'sentences',
		//     'sharedWA',
		//     'sharedFB',
		//     'sharedLI',
		//     'sharedEML',
		//     'sharedTWT',
		//     'Emotions',
		//     'emotional',
		//     'factual',
		//     'AbusiveContent',
		//     'generated_topic',
		//     'summary',
		//     'documentQuality',
		//     'sentencesLen',
		//   ]
		// )
		//   .limit(+limit)

		// Create a Pipeline for projection
		var pipeline = [
			{
				// $match: { userid: mongoose.Types.ObjectId(userId), isDeleted: deleted },
				$match: {
					$or: [
						{ userid: mongoose.Types.ObjectId(userId), isDeleted: deleted.toString() },
						// { collaborators: { $elemMatch: { userid: userid } } }
					]
				}
			},
			{
				$project: {
					_id: 1,
					updated_date: 1,
					created_date: 1,
					title: 1,
					isDeleted: 1,
					// preferences: 1,
					// 'sentences',
					// sharedWA: 1,
					// sharedFB: 1,
					// sharedLI: 1,
					// sharedEML: 1,
					// sharedTWT: 1,
					Emotions: 1,
					// emotional: 1,
					// factual: 1,
					// AbusiveContent: 1,
					generated_topic: 1,
					summary: 1,
					// documentQuality: 1,
					// 'sentencesLen':1,
					blocksLen: { $size: '$blocks' },
					sentencesLen: {
						$reduce: {
							input: '$blocks',
							initialValue: 0,
							in: { $sum: ['$$value', { $size: '$$this.sentences' }] }
						}
					},
					visibility: 1,
					// avgPositivity: 1,
					documentImage: 1,
					slugId: 1,
					collaborators: 1,
					category: 1,
					type: 1,
				},
			},
		]

		// NEW PIPELINE
		pipeline = [
			// Match documents with visibility set to "public"
			{
				$match: {
					$or: [
						// { userid: mongoose.Types.ObjectId(userId), isDeleted: deleted.toString(), isCopy: false },
						// { collaborators: { $elemMatch: { userid: userid } } }
						{ userid: mongoose.Types.ObjectId(userId), isDeleted: deleted.toString(), isCopy: false },
						{ userid: mongoose.Types.ObjectId(userId), isDeleted: deleted.toString(), isCopy: { $exists: false } }
					]
				}
			},
			// Lookup documents from the "blog" collection based on documentId
			{
				$lookup: {
					from: "publicdocs",
					localField: "_id",
					foreignField: "docId",
					as: "publicData"
				}
			},
			// Project the desired fields from the blog collection
			{
				$project: {
					_id: 1,
					updated_date: 1,
					created_date: 1,
					title: 1,
					isDeleted: 1,
					// preferences: 1,
					// 'sentences',
					// sharedWA: 1,
					// sharedFB: 1,
					// sharedLI: 1,
					// sharedEML: 1,
					// sharedTWT: 1,
					Emotions: 1,
					// emotional: 1,
					// factual: 1,
					// AbusiveContent: 1,
					generated_topic: 1,
					summary: 1,
					// documentQuality: 1,
					// 'sentencesLen':1,
					blocksLen: { $size: '$blocks' },
					sentencesLen: {
						$reduce: {
							input: '$blocks',
							initialValue: 0,
							in: { $sum: ['$$value', { $size: '$$this.sentences' }] }
						}
					},
					visibility: 1,
					// avgPositivity: 1,
					documentImage: 1,
					slugId: 1,
					category: 1,
					type: 1,
					collaborators: 1,
					publicData: 1,
				}
			},
			{
				$sort: {
					"updated_date": -1,
				}
			},
			// FOr pagination, add later
			{ $skip: page * limit },
			// { $limit: limit }
		];

		if (limit > 0) {
			// Add limit to pipeline
			pipeline.push({ $limit: limit })
		}

		// Execute the pipeline
		Document.aggregate(pipeline).exec((err, docList) => {
			if (err) {
				console.log('Error Getting Documents List : ', err)
				reject(err)
			} else {
				if (docList.length === 0 || docList === undefined || docList === null) {
					resolve([])
				} else {
					// docList.sort((a, b) =>
					//   new Date(a.updated_date) > new Date(b.updated_date)
					//     ? -1
					//     : new Date(b.updated_date) > new Date(a.updated_date)
					//     ? 1
					//     : 0
					// )
					resolve(docList)
				}
			}
		})
	})
}

exports.getAllPrivateDocuments = (userId, page, limit, visibility = "private") => {
	return new Promise((resolve, reject) => {


		// Create a Pipeline for private document projection
		var private_pipeline = [
			{
				// $match: { userid: mongoose.Types.ObjectId(userId), isDeleted: deleted },
				$match: {
					$or: [
						{ userid: mongoose.Types.ObjectId(userId), visibility: visibility },
						// { collaborators: { $elemMatch: { userid: userid } } }
					]
				}
			},
			{
				$project: {
					_id: 1,
					updated_date: 1,
					created_date: 1,
					title: 1,
					isDeleted: 1,
					preferences: 1,
					// 'sentences',
					// sharedWA: 0,
					// sharedFB: 0,
					// sharedLI: 0,
					// sharedEML: 0,
					// sharedTWT: 0,
					Emotions: 1,
					emotional: 1,
					factual: 1,
					AbusiveContent: 1,
					generated_topic: 1,
					summary: 1,
					documentQuality: 1,
					// 'sentencesLen':1,
					blocksLen: { $size: '$blocks' },
					sentencesLen: {
						$reduce: {
							input: '$blocks',
							initialValue: 0,
							in: { $sum: ['$$value', { $size: '$$this.sentences' }] }
						}
					},
					visibility: 1,
					avgPositivity: 1,
					documentImage: 1,
					slugId: 1,
					category: 1,
					type: 1,
				},
			},
			// sort the recent modified
			{
				$sort: {
					"updated_date": -1,
				}
			},
			{ $skip: page * limit },
			{ $limit: limit }
		]

		// Pipeline to show public document
		var public_pipeline = [
			// Match documents with visibility set to "public"
			{
				$match: {
					$or: [
						{ userid: mongoose.Types.ObjectId(userId), visibility: visibility },
						// { collaborators: { $elemMatch: { userid: userid } } }
					]
				}
			},
			// Lookup documents from the "blog" collection based on documentId
			{
				$lookup: {
					from: "publicdocs",
					localField: "_id",
					foreignField: "docId",
					as: "publicData"
				}
			},
			// Project the desired fields from the blog collection
			{
				$project: {
					_id: 1,
					updated_date: 1,
					created_date: 1,
					title: 1,
					isDeleted: 1,
					preferences: 1,
					// 'sentences',
					// sharedWA: 0,
					// sharedFB: 0,
					// sharedLI: 0,
					// sharedEML: 0,
					// sharedTWT: 0,
					Emotions: 1,
					emotional: 1,
					factual: 1,
					AbusiveContent: 1,
					generated_topic: 1,
					summary: 1,
					documentQuality: 1,
					// 'sentencesLen':1,
					blocksLen: { $size: '$blocks' },
					sentencesLen: {
						$reduce: {
							input: '$blocks',
							initialValue: 0,
							in: { $sum: ['$$value', { $size: '$$this.sentences' }] }
						}
					},
					visibility: 1,
					avgPositivity: 1,
					documentImage: 1,
					slugId: 1,
					category: 1,
					type: 1,
					publicData: 1,
				}
			},
			// sort the recent modified
			{
				$sort: {
					"updated_date": -1,
				}
			},
			// FOr pagination
			{ $skip: page * limit },
			{ $limit: limit }
		];

		var pipeline = visibility === "private" ? private_pipeline : public_pipeline

		// Execute the pipeline
		Document.aggregate(pipeline).exec((err, docList) => {
			if (err) {
				console.log('Error Getting Documents List : ', err)
				reject(err)
			} else {
				if (docList.length === 0 || docList === undefined || docList === null) {
					resolve([])
				} else {
					// docList.sort((a, b) =>
					//   new Date(a.updated_date) > new Date(b.updated_date)
					//     ? -1
					//     : new Date(b.updated_date) > new Date(a.updated_date)
					//     ? 1
					//     : 0
					// )
					resolve(docList)
				}
			}
		})
	})
}

// exports.findDocumentBySearch = searchString => {
//   return Document.find({userid: mongoose.Types.ObjectId(userId),isDeleted: deleted , $or:[{'title':{ $regex: `.*${searchString}.*`, $options : 'i' }},{'sentences.modified': { $regex: `.*${searchString}.*`, $options : 'i' }}]})
// }
exports.findDocumentBySearch = (userId, deleted = 0, shearchValue, page, limit, visibility) => {
	return new Promise((resolve, reject) => {
		Document.find(
			{
				$or: [
					{
						userid: mongoose.Types.ObjectId(userId),
						isDeleted: deleted,
						visibility: { $in: visibility },
						isCopy: { $exists: false },
						$or: [
							{ title: { $regex: `.*${shearchValue}.*`, $options: 'i' } },
							{
								'blocks.modified': {
									$regex: `.*${shearchValue}.*`,
									$options: 'i',
								},
							},
						],
					},
					{
						userid: mongoose.Types.ObjectId(userId),
						isDeleted: deleted,
						visibility: { $in: visibility },
						isCopy: false,
						$or: [
							{ title: { $regex: `.*${shearchValue}.*`, $options: 'i' } },
							{
								'blocks.modified': {
									$regex: `.*${shearchValue}.*`,
									$options: 'i',
								},
							},
						],
					},
				]

			},
			[
				'_id',
				'updated_date',
				'created_date',
				'title',
				'isDeleted',
				'preferences',
				// 'sentences',
				// 'sharedWA',
				// 'sharedFB',
				// 'sharedLI',
				// 'sharedEML',
				// 'sharedTWT',
				'Emotions',
				'emotional',
				'factual',
				'AbusiveContent',
				'generated_topic',
				'summary',
				'documentQuality',
				'sentencesLen',
				'category',
				'type',
				'visibility'
			]
		)
			.skip(page * limit)
			.limit(limit)
			.exec((err, docList) => {
				if (err) {
					console.log('Error In document Search..', err)
					reject(err)
				} else {
					if (
						docList.length === 0 ||
						docList === undefined ||
						docList === null
					) {
						resolve([])
					} else {
						docList.sort((a, b) =>
							new Date(a.updated_date) > new Date(b.updated_date)
								? -1
								: new Date(b.updated_date) > new Date(a.updated_date)
									? 1
									: 0
						)
						resolve(docList)
					}
				}
			})
	})
}

exports.findDocumentById = docid => {
	return Document.findOne(
		{ _id: mongoose.Types.ObjectId(docid) }
	).populate('collaborators.userid', 'fname lname profilepic handle')
		// .populate('blocks.collaboratorComments.userid', 'fname lname handle profilepic')
		.populate('originalEditor', 'fname lname handle profilepic')
		.populate('currentEditor', 'fname lname handle profilepic')
		.lean()
}
exports.sharedDocumentByWA = docId => {
	return Document.findOneAndUpdate(
		{ _id: { $in: docId } },
		{ $inc: { sharedWA: 1 } }
	).lean()
}

exports.sharedDocumentByFB = docId => {
	return Document.findOneAndUpdate(
		{ _id: { $in: docId } },
		{ $inc: { sharedFB: 1 } }
	).lean()
}

exports.sharedDocumentByEML = docId => {
	return Document.findOneAndUpdate(
		{ _id: { $in: docId } },
		{ $inc: { sharedEML: 1 } }
	).lean()
}

exports.sharedDocumentByTWT = docId => {
	return Document.findOneAndUpdate(
		{ _id: { $in: docId } },
		{ $inc: { sharedTWT: 1 } }
	).lean()
}

exports.sharedDocumentByLI = docId => {
	return Document.findOneAndUpdate(
		{ _id: { $in: docId } },
		{ $inc: { sharedLI: 1 } }
	).lean()
}

exports.restoreDocument = docid => {
	return Document.findOneAndUpdate(
		{ _id: { $in: docid } },
		{ isDeleted: '0' }
	).lean()
}
exports.removeByLength = document => {
	return new Promise((resolve, reject) => {
		Document.deleteMany({ _id: { $in: document } }, err => {
			if (err) {
				reject(err)
			} else {
				resolve(err)
			}
		})
	})
}
exports.removeById = docId => {
	return new Promise((resolve, reject) => {
		Document.deleteMany({ _id: { $in: docId } }, err => {
			if (err) {
				reject(err)
			} else {
				resolve(err)
			}
		})
	})
}

// update document using find and save technique
exports.patchDocument = document => {
	const {
		docid,
		title,
		sentences,
		Emotions,
		emotional,
		factual,
		AbusiveContent,
		generated_topic,
		summary,
	} = document
	// console.log('sent patch document ', sentences)
	return new Promise((resolve, reject) => {
		Document.findById(docid, function (err, doc) {
			if (err || doc === null) {
				reject(err)
			} else {
				doc['title'] =
					title === undefined || title === null || title === ''
						? doc['title']
						: title
				doc['updated_date'] = getUTCDate()
				doc['Emotions'] =
					Emotions === '' || Emotions === undefined || Emotions === null
						? doc['Emotions']
						: Emotions

				// loop through all sentences and update the metrics if available
				if (sentences !== '') doc['sentences'] = sentences

				doc['emotional'] =
					emotional === '' || emotional === undefined || emotional === null
						? doc['emotional']
						: emotional
				doc['factual'] =
					factual === '' || factual === undefined || factual === null
						? doc['factual']
						: factual
				doc['AbusiveContent'] =
					AbusiveContent === '' ||
						AbusiveContent === undefined ||
						AbusiveContent === null
						? doc['AbusiveContent']
						: AbusiveContent
				doc['generated_topic'] =
					generated_topic === '' ||
						generated_topic === undefined ||
						generated_topic === null
						? doc['generated_topic']
						: generated_topic
				doc['summary'] =
					summary === '' || summary === undefined || summary === null
						? doc['summary']
						: summary
				doc.save(function (err, updatedDoc) {
					if (err) return reject(err)
					delete updatedDoc.__v
					resolve(updatedDoc)
				})
			}
		})
	})
}

exports.updateSummary = (id, summary) => {
	return Document.findOneAndUpdate({ _id: id }, { summary: summary }, { new: true }).lean()
}

exports.updateIntent = (id, intent) => {
	return Document.findOneAndUpdate({ _id: id }, { intent: intent }, { new: true }).lean()
}

exports.updateEmotions = (id, top_emo) => {
	return Document.findOneAndUpdate({ _id: id }, { Emotions: top_emo }, { new: true })
		// .populate('blocks.collaboratorComments.userid', 'fname lname handle profilepic')
		.lean()
}
exports.updateTopics = (id, topics) => {
	return Document.findOneAndUpdate(
		{ _id: id },
		{ generated_topic: topics },
		{ new: true }
	).lean()
}

exports.updateDocQuality = (id, quality, blocks) => {
	return Document.findOneAndUpdate(
		{ _id: id },
		{
			documentQuality: quality,
			blocks: blocks
		},
		{ new: true }
	)
		// .populate('blocks.collaboratorComments.userid', 'fname lname handle profilepic')
		.lean()
}
exports.update_EmotionalFactual = (id, emo, fct, emo_pct, factual_pct) => {
	return Document.findOneAndUpdate(
		{ _id: id },
		{
			emotional: emo,
			factual: fct,
			emotional_score: emo_pct,
			factual_score: factual_pct,
		},
		{ new: true }
	)
		// .populate('blocks.collaboratorComments.userid', 'fname lname handle profilepic')
		.lean()
}
exports.update_EmotionalFactual_Sentences = (
	id,
	emo,
	fct,
	blocks
) => {
	return Document.findOneAndUpdate(
		{ _id: id },
		{
			emotional: emo,
			factual: fct,
			blocks: blocks,
		},
		{ new: true }
	).lean()
}

// helper to calculate sentence length
const calculate_sentence_len = (blocks) => {
	let totalSentences = 0;
	blocks.forEach((blocks) => {
		totalSentences += blocks.sentences.length;
	});
	return totalSentences;
}
exports.update_Sentences = (id, blocks, doc_title, quality) => {
	let updated = getUTCDate()
	// get sentences len
	let sentenceLen = calculate_sentence_len(blocks)

	return Document.findOneAndUpdate(
		{ _id: id },
		{ blocks: blocks, title: doc_title, updated_date: updated, sentencesLen: sentenceLen, blocksLen: blocks.length, documentQuality: quality },
		{ new: true }
	)
		// .populate('blocks.collaboratorComments.userid', 'fname lname handle profilepic')
		.lean()
}
exports.update_sentences_positivity = (id, blocks, doc_title, avg_pos) => {
	return Document.findOneAndUpdate(
		{ _id: id },
		{ blocks: blocks, title: doc_title, avgPositivity: avg_pos },
		{ new: true }
	)
		// .populate('blocks.collaboratorComments.userid', 'fname lname handle profilepic')
		.lean()
}

exports.update_blocks_abusive = (id, blocks, is_abusive) => {
	return Document.findOneAndUpdate(
		{ _id: id },
		{ blocks: blocks, AbusiveContent: is_abusive },
		{ new: true }
	)
		// .populate('blocks.collaboratorComments.userid', 'fname lname handle profilepic')
		.lean()
}

exports.updateAbusive = (id, abusive, sents) => {
	return Document.findOneAndUpdate(
		{ _id: id },
		{ AbusiveContent: abusive, sentences: sents },
		{ new: true }
	).lean()
}

exports.updateTitle = (id, title) => {
	return Document.findOneAndUpdate({ _id: id }, { title: title }, { new: true }).lean()
}

// update document preference using find and save technique
exports.patchDocumentPreference = document => {
	const { docid, preferences } = document
	return new Promise((resolve, reject) => {
		Document.findById(docid, function (err, doc) {
			if (err || doc === null) {
				reject(err)
			} else {
				doc['preferences'] = preferences

				doc.save(function (err, updatedDoc) {
					if (err) return reject(err)
					delete updatedDoc.__v
					resolve(updatedDoc)
				})
			}
		})
	})
}

// update document using find and save technique
exports.softDeleteDocument = document => {
	const { docid } = document
	return new Promise((resolve, reject) => {
		Document.findById(docid, function (err, doc) {
			if (err || doc === null) {
				reject(err)
			} else {
				doc['isDeleted'] = '1'
				doc['updated_date'] = getUTCDate()
				doc.save(function (err, updatedDoc) {
					if (err) return reject(err)
					delete updatedDoc.__v
					resolve(updatedDoc)
				})
			}
		})
	})
}

exports.deleteDocument = userId => {
	return Document.deleteMany({ userid: userId })
}

exports.updateVisibility = (docId, visibility) => {
	return Document.updateOne(
		{ _id: docId },
		{ visibility: visibility },
		{ new: true }
	)
}

exports.findBySlug = slugId => {
	return Document.findOne({ slugId })
		.populate({
			path: 'userid',
			select: ['fname', 'lname', 'profilepic', 'about', 'handle'],
		})
		.select("title visibility Emotions emotional factual avgPositivity AbusiveContent category documentQuality.readTime created_date updated_date blocks.htmlType blocks.sentences documentImage slugId")
		.lean()

}

exports.updateDocImg = (docId, image) =>
	Document.findOneAndUpdate({ _id: docId }, { documentImage: image })

exports.checkIfDocAlreadyExist = (docId, userId) =>
	Document.findOne({ _id: docId, userid: userId })

exports.getDocCount = userId =>
	Document.find({ userid: userId }).countDocuments()


// Update Toxicity
exports.updateToxcity = (id, document, sentence) => {
	return Document.findOneAndUpdate({ _id: id }, { toxicity: document, blocks: sentence }, { new: true })
		// .populate('blocks.collaboratorComments.userid', 'fname lname handle profilepic')
		.lean()
}

// Collaboration
exports.addCollaboration = (id, isCollaborated, collaborators) => {
	return Document.findOneAndUpdate(
		{ _id: id },
		{
			// isCollaborated: isCollaborated,
			// collaborators: collaborators,
			$addToSet: { collaborators: { $each: collaborators } }
		}, { new: true })
		.populate('collaborators.userid', 'fname lname profilepic handle')
		.lean()
}

exports.updateCollaboration = (id, isCollaborated, editor) => {
	return Document.findOneAndUpdate(
		{ _id: id },
		{
			// isCollaborated: isCollaborated,
			// collaborators: collaborators,
			currentEditor: editor
		},
		{ new: true }
	).lean()
}

exports.removeCollaborator = (id, collaborator_id) => {
	return Document.findOneAndUpdate(
		{ _id: id },
		{
			$pull: { collaborators: { userid: collaborator_id } }
		},
		{ new: true }
	).populate('collaborators.userid', 'fname lname profilepic handle')
		.populate('originalEditor', 'fname lname handle profilepic')
		.populate('currentEditor', 'fname lname handle profilepic')
		.lean()
}

exports.acceptCollaboration = (id, collaborator_id) => {
	return Document.findOneAndUpdate(
		{ _id: id, "collaborators.userid": collaborator_id },
		{
			visibility: "private", // make document private, if not already
			isCollaborated: true,
			$set: { "collaborators.$.status": "accepted" }
		},
		{ new: true }
	).lean()
}

exports.rejectCollaboration = (id, collaborator_id) => {
	return Document.findOneAndUpdate(
		{ _id: id, "collaborators.userid": collaborator_id },
		{
			$set: { "collaborators.$.status": "rejected" }
		},
		{ new: true }
	).lean()
}

exports.findAllAuthors = (userid, page, pageSize) => {
	if (userid) {
		var given_userid = mongoose.Types.ObjectId(userid);
	} else {
		var given_userid = ""
	}

	return Document.aggregate([
		{ $match: { visibility: "public" } },
		{ $group: { _id: "$userid" } },
		{
			$lookup: {
				from: "users",
				localField: "_id",
				foreignField: "_id",
				as: "userDetails"
			}
		},
		{ $unwind: "$userDetails" },
		{
			$addFields: {
				isFollowing: {
					$cond: {
						if: { $isArray: "$userDetails.followers" },
						then: { $in: [given_userid, "$userDetails.followers"] },
						else: false
					}
				}
			}
		},
		{
			$project: {
				_id: "$userDetails._id",
				fname: "$userDetails.fname",
				lname: "$userDetails.lname",
				profilepic: "$userDetails.profilepic",
				about: "$userDetails.about",
				handle: "$userDetails.handle",
				followers: "$userDetails.followers",
				userRating: "$userDetails.userRating",
				isFollowing: 1
			}
		},
		// Sorting by id to get consistent result
		{ $sort: { "_id": 1 } },
		// FOr pagination, add later
		{ $skip: page * pageSize },
		{ $limit: pageSize }
	]).exec();
}

// Document Count for User Badge
exports.DocumentCountForBeginner = (userid, days = 7) => {
	var sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - days);
	var minSentences = 10
	return Document.find({
		// created_date: { $gte: sevenDaysAgo },
		userid: userid,
		updated_date: { $gte: sevenDaysAgo },
		sentencesLen: { $gt: minSentences },
	},
		{ _id: 1 }
	).lean()
}

// Document Count for User Badge
exports.DocumentCountForUserCategory = (userid, category) => {
	var minSentences = 10
	return Document.find({
		userid: userid,
		category: category,
		sentencesLen: { $gt: minSentences },
	},
		{ _id: 1 }
	).lean()
}

// For user badge
exports.UserDocumentCount = (userid) => {
	var minSentences = 10
	return Document.find({
		userid: userid,
		sentencesLen: { $gt: minSentences },
	},
		{ _id: 1 }
	).lean()
}

// For user badge
exports.UserPublicDocumentCount = (userid) => {
	return Document.find({
		userid: userid,
		visibility: "public"
	},
		{ _id: 1 }
	).lean()
}

// for user badge
exports.UserPublicDocRatings = async (userid) => {
	var pipeline = [
		// Match documents with visibility set to "public"
		{
			$match: {
				$or: [
					{ userid: mongoose.Types.ObjectId(userid), visibility: "public" },
					// { collaborators: { $elemMatch: { userid: userid } } }
				]
			}
		},
		// Lookup documents from the "blog" collection based on documentId
		{
			$lookup: {
				from: "publicdocs",
				localField: "_id",
				foreignField: "docId",
				as: "publicData"
			}
		},
		// Project the desired fields from the blog collection
		{
			$project: {
				_id: 1,
				rating: "$publicData.usersRating.rating"
			}
		},
		// sort the recent modified
		{
			$sort: {
				"publicData.publishDate": -1,
			}
		},
		{ $limit: 5 }
	];

	return Document.aggregate(pipeline)
}

// udpate document category
exports.updateDocumentCategory = (id, category) => {
	return Document.findOneAndUpdate(
		{ _id: id },
		{
			category: category
		},
		{ new: true }
	).lean()
}

exports.getDocumentsForReview = (collaborator_id, status = false, page, item_per_page) => {
	var match = {
		userid: collaborator_id
	}
	if (status) {
		match.status = status
	}
	console.log(match)
	return Document.find({
		collaborators: {
			$elemMatch: match,
		},
	})
		.skip((page - 1) * item_per_page)
		.limit(item_per_page)
		.select("title userid visibility type category summary generated_topic isDeleted collaborators created_data updated_date slugId publicData blocksLen sentencesLen")
		// .populate('collaborators.userid', 'fname lname profilepic handle')
		.lean()
}

exports.getSharedForReviewDocuments = (user_id, page, item_per_page) => {
	return Document.find({
		userid: user_id,
		collaborators: { $exists: true, $ne: [] },
	})
		.skip((page - 1) * item_per_page)
		.limit(item_per_page)
		.select("title userid visibility type category summary generated_topic isDeleted collaborators created_data updated_date slugId publicData blocksLen sentencesLen")
		// .populate('collaborators.userid', 'fname lname profilepic handle')
		.lean()
}

// to get all review documents
exports.getAllCollabDocuments = (user_id, page, item_per_page) => {

	return Document.find({
		$or: [
			{ userid: user_id, collaborators: { $exists: true, $ne: [] } },
			{ collaborators: { $elemMatch: { userid: user_id } } }
		]
	})
		.skip((page - 1) * item_per_page)
		.limit(item_per_page)
		.select("title userid visibility type category summary generated_topic isDeleted collaborators created_data updated_date slugId publicData blocksLen sentencesLen")
		// .populate('collaborators.userid', 'fname lname profilepic handle')
		.lean()
}

// TO add comment in collab document
exports.addCollabComments = (collaboratorId, doc_id, blockId, comment, root) => {

	return Document.findOneAndUpdate(
		{ _id: doc_id, 'blocks._id': blockId },
		{
			$push: {
				'blocks.$.collaboratorComments': {
					userid: collaboratorId,
					comment: comment,
					root: root,
				},
			},
		},
		{ new: true }
	).populate({
		path: 'blocks.collaboratorComments.userid',
		select: 'fname lname handle profilepic',
	})
		.select("blocks.collaboratorComments")
		.lean()

}

// Update Collab Comment
exports.updateCollabComment = (doc_id, commentId, comment) => {
	return Document.findOneAndUpdate(
		{ _id: doc_id, 'blocks.collaboratorComments._id': commentId },
		{
			$set: {
				'blocks.$[].collaboratorComments.$[comment].comment': comment,
			},
		},
		{ new: true, arrayFilters: [{ 'comment._id': commentId }] }
	).populate({
		path: 'blocks.collaboratorComments.userid',
		select: 'fname lname handle profilepic',
	})
		.select("blocks.collaboratorComments")
		.lean()
}

// Delete a Collab Comment
exports.deleteCollabComment = (doc_id, commentId) => {
	return Document.findOneAndUpdate(
		{ _id: doc_id },
		{
			$pull: {
				'blocks.$[].collaboratorComments': { $or: [{ _id: commentId }, { root: commentId }] },
			},
		},
		{ new: true }
	).populate({
		path: 'blocks.collaboratorComments.userid',
		select: 'fname lname handle profilepic',
	})
		.select("blocks.collaboratorComments")
		.lean()
}

// Change Editor
exports.changeEditor = (doc_id, editor_id, deadline) => {
	return Document.findOneAndUpdate(
		{ _id: doc_id, 'collaborators.userid': editor_id },
		{
			$set: {
				'currentEditor': editor_id,
				'collaborators.$.deadline': new Date(deadline),
			},
		},
		{ new: true }
	)
		.populate('blocks.collaboratorComments.userid', 'fname lname handle profilepic')
		.populate('collaborators.userid', 'fname lname profilepic handle')
		.populate('originalEditor', 'fname lname handle profilepic')
		.populate('currentEditor', 'fname lname handle profilepic')
		.lean()
}

// To save copy document
exports.createCopyDocument = async (doc) => {
	const document = new Document(doc)
	const time = getUTCDate()
	const rand = +Math.random() + time
	document['slugId'] = Buffer.from(rand.substr(2), 'hex').toString('base64').replace(/[/=]/g, "")
	let saved_doc = await document.save()
	console.log(saved_doc._id)
	return Document.findOne({ _id: saved_doc._id })
		.select("title visibility type category summary generated_topic isDeleted collaborators created_data updated_date slugId publicData blocksLen sentencesLen")
		.lean()
}

// get copy document
exports.findCopyDocumentById = (docid, user_id) => {
	return Document.findOne({ originalDoc: docid, userid: user_id })
		.populate('collaborators.userid', 'fname lname profilepic handle')
		// .populate('blocks.collaboratorComments.userid', 'fname lname handle profilepic')
		.populate('originalEditor', 'fname lname handle profilepic')
		.populate('currentEditor', 'fname lname handle profilepic')
		.lean();
}

// find collab comments
exports.findAllCollabComments = (docid, user_id) => {
	return Document.findOne({ _id: mongoose.Types.ObjectId(docid) })
		.populate({
			path: 'blocks.collaboratorComments.userid',
			select: 'fname lname handle profilepic',
		})
		.select("blocks.collaboratorComments")
		.lean();
}

// find collaborators
exports.findAllCollaborators = (docid, user_id) => {
	return Document.findOne({ _id: mongoose.Types.ObjectId(docid) })
		.populate({
			path: 'collaborators.userid',
			select: 'fname lname handle profilepic',
		})
		.select("collaborators")
		.lean();
}

// TO search collab documents
exports.searchReviewDocuments = async (userId, searchValue, page, limit, isReview, isShared) => {
	let search_condition = []

	let shared_for_review = {
		userid: mongoose.Types.ObjectId(userId),
		collaborators: { $exists: true, $ne: [] },
		$or: [
			{ title: { $regex: `.*${searchValue}.*`, $options: 'i' } },
			{
				'blocks.modified': {
					$regex: `.*${searchValue}.*`,
					$options: 'i',
				},
			},
		],
	}

	let shared_with_me = {
		collaborators: { $elemMatch: { userid: userId } },
		$or: [
			{ title: { $regex: `.*${searchValue}.*`, $options: 'i' } },
			{
				'blocks.modified': {
					$regex: `.*${searchValue}.*`,
					$options: 'i',
				},
			},
		],
	}

	if (isReview) {
		// Means I sent for review
		search_condition.push(shared_for_review)
	}
	else if (isShared) {
		// Means shared for me to review
		search.condition.push(shared_with_me)
	}
	else {
		search_condition.push(shared_for_review)
		search_condition.push(shared_with_me)
	}



	return new Promise((resolve, reject) => {
		Document.find(
			{
				$or: search_condition

			},
			[
				'_id',
				'updated_date',
				'created_date',
				'title',
				'isDeleted',
				'preferences',
				// 'Emotions',
				'emotional',
				'factual',
				'AbusiveContent',
				'generated_topic',
				'summary',
				// 'documentQuality',
				'sentencesLen',
				'category',
				'type',
				'visibility',
				'collaborators',
				'userid'
			]
		)
			// .populate('collaborators.userid', 'fname lname profilepic handle')
			.skip(page * limit)
			.limit(limit)
			.exec((err, docList) => {
				console.log(docList)
				if (err) {
					console.log('Error In document Search..', err)
					reject(err)
				} else {
					if (
						docList.length === 0 ||
						docList === undefined ||
						docList === null
					) {
						resolve([])
					} else {
						docList.sort((a, b) =>
							new Date(a.updated_date) > new Date(b.updated_date)
								? -1
								: new Date(b.updated_date) > new Date(a.updated_date)
									? 1
									: 0
						)
						resolve(docList)
					}
				}
			})
	})
}

// To complete collaboration
exports.completeCollaboration = async (doc_id, editor) => {
	return Document.findOneAndUpdate(
		{ _id: doc_id },
		{
			$set: {
				'collaborationStatus.userid': editor,
				'collaborationStatus.status': true,
			},
		},
		{ new: true }
	).populate('originalEditor', 'fname lname handle profilepic')
		.populate('currentEditor', 'fname lname handle profilepic')
		.lean()
}

// Add editor to collaboration status
exports.addEditorToCollaborationStatus = async (doc_id, editor) => {
	return Document.findOneAndUpdate(
		{ _id: doc_id },
		{
			$set: {
				'collaborationStatus.userid': editor,
				'collaborationStatus.status': false,
				'collaborationStatus.removeRequest': false,
				'collaborationStatus.nextEditor': {},
			},
		},
		{ new: true }
	).populate('originalEditor', 'fname lname handle profilepic')
		.populate('currentEditor', 'fname lname handle profilepic')
		.lean()
}

// Delete All document Copies
exports.deleteDocumentCopies = async (doc_id) => {
	return Document.deleteMany(
		{ originalDoc: doc_id },
	)
		.lean()
}

// Delete single copy document
exports.deleteCopyDocument = async (doc_id) => {
	return Document.deleteOne(
		{ _id: doc_id },
	)
		.lean()
}

// Delete all collaboration related items
exports.finalCollaboration = async (doc_id) => {
	try {
		const doc = await Document.findOne({ _id: doc_id }).populate('originalEditor', 'fname lname handle profilepic').populate('currentEditor', 'fname lname handle profilepic');
		if (doc) {
			doc.collaborators = [];
			doc.isCollaborated = false;
			doc.collaborationStatus = {};

			for (const block of doc.blocks) {
				block.collaboratorComments = [];
			}
			doc.currentEditor = doc.originalEditor;

			await doc.save();

			console.log('Document updated successfully');
			return doc;
		} else {
			console.log('Document not found');
			return null;
		}
	} catch (error) {
		console.error('Error updating document:', error);
		throw error; // You might want to handle this error at a higher level
	}
}

// Change Editor to orignal
exports.changeEditorToOriginal = async (doc_id) => {
	try {
		const doc = await Document.findOne({ _id: doc_id }).populate('collaborators.userid', 'fname lname profilepic handle')
			.populate('originalEditor', 'fname lname handle profilepic')
			.populate('currentEditor', 'fname lname handle profilepic')

		if (doc) {
			doc.currentEditor = doc.userid;

			await doc.save();

			console.log('Document updated successfully');
			return doc;
		} else {
			console.log('Document not found');
			return null;
		}
	} catch (error) {
		console.error('Error updating document:', error);
		throw error;
	}
}

// Change Editor to orignal
exports.removeEditorRequest = async (doc_id, nextEditor) => {
	let updateSet = {
		'collaborationStatus.removeRequest': true,
	}
	if (nextEditor) {
		updateSet["collaborationStatus.nextEditor"] = nextEditor
	}
	return Document.findOneAndUpdate(
		{ _id: doc_id },
		{
			$set: updateSet,
		},
		{ new: true }
	).populate('collaborators.userid', 'fname lname profilepic handle')
		.populate('originalEditor', 'fname lname handle profilepic')
		.populate('currentEditor', 'fname lname handle profilepic')
		.lean()
}

// Get all collaborated documents for Deadline checking
exports.findAllCollaboratedDocumentForDeadline = (user_id) => {
	return Document.find({
		userid: mongoose.Types.ObjectId(user_id),
		isCollaborated: true
	})
		.populate('collaborators.userid', 'fname lname profilepic handle')
		.populate('originalEditor', 'fname lname handle profilepic')
		.select("title collaborators collaborationStatus currentEditor")
		.lean();
}


// Get ID of all documents of a user for getting top AI rated document
exports.getAllUserDocumentsIds = (user_id) => {
	return Document.find({
		userid: user_id,
	})
		.select("_id")
		.lean()
		.then((documents) => documents.map((doc) => doc._id));
}