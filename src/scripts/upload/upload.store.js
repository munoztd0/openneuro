// dependencies ----------------------------------------------------------------------

import React         from 'react';
import Reflux        from 'reflux';
import Actions       from './upload.actions.js';
import scitran       from '../utils/scitran';
import upload        from './upload';
import files         from '../utils/files';
import validate      from 'bids-validator';
import userStore     from '../user/user.store';
import datasetsStore from '../dashboard/datasets.store';
import {Link}        from 'react-router';

// store setup -----------------------------------------------------------------------

let UploadStore = Reflux.createStore({

	listenables: Actions,

	init: function () {
		this.setInitialState();
	},

	getInitialState: function () {
		return this.data;
	},

// state data ------------------------------------------------------------------------

	data: {},

	update: function (data) {
		for (let prop in data) {this.data[prop] = data[prop];}
		this.trigger(this.data);
	},

	/**
	 * Set Initial State
	 *
	 * Sets the state to the data object defined
	 * inside the function. Also takes a diffs object
	 * which will set the state to the initial state
	 * with any differences passed.
	 */
	setInitialState: function (diffs) {
		let data = {
			tree: [],
			list: {},
			errors: [],
			warnings: [],
			refs: {},
			dirName: '',
			nameError: null,
			changeName: false,
			showSelect: true,
			showRename: false,
			showIssues: false,
			showResume: false,
			showProgress: false,
			showSuccess: false,
			activeKey: 1,
			alert: null,
			disabledTab: false,
			alertMessage: '',
			uploadStatus: 'not-started',
			progress: {total: 0, completed: 0, currentFiles: []},
		};
		for (let prop in diffs) {data[prop] = diffs[prop];}
		this.update(data);
	},

// actions ---------------------------------------------------------------------------

	/**
	 * On Change
	 *
	 * On file select this adds files to the state
	 * and starts validation.
	 */
	onChange (selectedFiles) {
		let dirName = selectedFiles.tree[0].name,
		    nameError = null;
		if (dirName.length > 32) {
			nameError = 'Names must be 32 characters or less';
		}
		this.setInitialState({
			refs: this.data.refs,
			tree: selectedFiles.tree,
			list: selectedFiles.list,
			dirName: dirName,
			nameError: nameError,
			uploadStatus: 'files-selected',
			showRename: true,
			activeKey: 2
		});
	},

	/**
	 * Validate
	 *
	 * Takes a filelist, runs BIDS validation checks
	 * against it, and sets any errors to the state.
	 */
	validate (selectedFiles) {
		let self = this;
		self.update({uploadStatus: 'validating', showIssues: true, activeKey: 3});
        validate.BIDS(selectedFiles, function (errors, warnings) {
        	
        	if (errors === 'Invalid') {
        		self.update({errors: 'Invalid'});
        	}

        	errors   = errors   ? errors   : [];
        	warnings = warnings ? warnings : [];

			self.update({
				errors: errors,
				warnings: warnings,
				uploadStatus: 'validated'
			});

			if (errors.length === 0 && warnings.length === 0) {
	        	self.checkExists(self.data.tree);
	        }
        });
	},

	checkExists (fileTree) {
		// rename dirName before upload
		fileTree[0].name = this.data.dirName;

		if (this.data.uploadStatus === 'dataset-exists') {
			this.upload(fileTree);
			return;
		}

		let self = this;
		let userId = userStore.data.scitran._id;
		scitran.getProjects(function (projects) {
			let existingProjectId;
			for (let project of projects) {
                if (project.name === fileTree[0].name && project.group === userId) {
                    existingProjectId = project._id;
                    break;
                }
            }

            if (existingProjectId) {
				self.update({uploadStatus: 'dataset-exists', showResume: true, activeKey: 4});
            } else {
            	self.upload(fileTree);
            }
		});
	},

	/**
	 * Upload
	 *
	 * Uploads currently selected and triggers
	 * a progress event every time a file or folder
	 * finishes.
	 */
	upload (fileTree) {
		fileTree[0].name = this.data.dirName;
		
		let self = this;
		let count = files.countTree(fileTree);

		this.update({
			uploadStatus: 'uploading',
			showProgress: true,
			disabledTab: true,
			activeKey: 5
		});
		
		upload.upload(userStore.data.scitran._id, fileTree, count, function (progress, projectId) {
			self.update({progress: progress, uploading: true});
			window.onbeforeunload = function() {return "You are currently uploading files. Leaving this site will cancel the upload process.";};
			if (progress.total === progress.completed) {
				self.uploadComplete(projectId);
			}
		});
	},

	/**
	 * Upload Complete
	 *
	 * Resets the componenent state to its
	 * initial state. And creates an upload
	 * complete alert.
	 */
	uploadComplete (projectId) {
		let fileSelect = React.findDOMNode(this.data.refs.fileSelect);
		if (fileSelect) {fileSelect.value = null;} // clear file input

		let message = (
			<span><a href={"#/dataset/" + projectId}>{this.data.dirName}</a> has been added and saved to your dashboard.</span>
		);

		datasetsStore.getDatasets();

		this.setInitialState({
			alert: 'Success',
			alertMessage: message
		});
		window.onbeforeunload = function() {};
	},

	/**
	 * Upload Error
	 *
	 */
	uploadError () {
		this.setInitialState({alert: 'Error', alertMessage: 'There was an error uploading your dataset. Please refresh the page and try again. If the issue persists, contact the site administrator.'});
		window.onbeforeunload = function() {};
	},

	/**
	 * Close Alert
	 *
	 */
	closeAlert () {
		this.update({alert: false});
	},

	/**
	 * Toggle Name Input
	 *
	 * Toggles the visibility of the dir name chnage
	 * field.
	 */
	toggleNameInput() {
		this.update({changeName: !this.data.changeName});
	},

	/**
	 * Update Directory Name
	 *
	 * Sets the directory name to the passed value.
	 */
	updateDirName(value) {
		let nameError = this.data.nameError;
		if (value.length > 32) {
			nameError = 'Names must be 32 characters or less';
		} else {
			nameError = null;
		}

		this.update({
			dirName: value,
			showResume: false,
			nameError: nameError
		});
	},

	/**
	 * Select Tab
	 *
	 * Sets the state to open the selected tab
	 * in the upload menu.
	 */
	selectTab(activeKey) {
		this.update({activeKey});
	},

	/**
	 * Set Refs
	 *
	 * Takes a react refs and store them.
	 */
	setRefs(refs) {
		this.update({refs: refs});
	}

});

export default UploadStore;