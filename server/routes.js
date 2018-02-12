// dependencies ------------------------------------

import express from 'express'
import users from './handlers/users'
import awsJobs from './handlers/awsJobs'
import eventLogs from './handlers/eventLogs'
import validation from './handlers/validation'
import datasets from './handlers/datasets'
<<<<<<< HEAD
import comments from './handlers/comments'
=======
import subscriptions from './handlers/subscriptions'
>>>>>>> 6b4287b4... add handler and routes for dataset subscriptions
import auth from './libs/auth'
import scitran from './libs/scitran'
import schema from './libs/schema'
import schemas from './schemas'

import fileUpload from 'express-fileupload'

const routes = [
  // users ---------------------------------------

  {
    method: 'get',
    url: '/users/self',
    handler: scitran.verifyUser,
  },
  {
    method: 'get',
    url: '/users/signin/orcid',
    handler: users.validateORCIDToken,
  },
  {
    method: 'get',
    url: '/users/orcid/refresh',
    handler: users.refreshORCIDToken,
  },
  {
    method: 'get',
    url: '/users/orcid',
    handler: users.getORCIDProfile,
  },
  {
    method: 'post',
    url: '/users',
    middleware: [schema.validateBody(schemas.user.new)],
    handler: users.create,
  },
  {
    method: 'post',
    url: '/users/blacklist',
    middleware: [schema.validateBody(schemas.user.blacklisted), auth.superuser],
    handler: users.blacklist,
  },
  {
    method: 'get',
    url: '/users/blacklist',
    middleware: [auth.superuser],
    handler: users.getBlacklist,
  },
  {
    method: 'delete',
    url: '/users/blacklist/:id',
    middleware: [auth.superuser],
    handler: users.unBlacklist,
  },

  // datasets ------------------------------------
  // Note: most dataset interactions are sent directly to Scitran.
  // These manage those that need to be modified or proxied.

  {
    method: 'post',
    url: '/datasets',
    handler: datasets.create,
  },
  {
    method: 'post',
    url: '/datasets/:datasetId/snapshot',
    handler: datasets.snapshot,
  },
  {
    method: 'post',
    url: '/datasets/:datasetId/permissions',
    handler: datasets.share,
  },

  // validation ----------------------------------

  {
    method: 'post',
    url: '/datasets/:datasetId/validate',
    middleware: [auth.user],
    handler: validation.validate,
  },

  // jobs ----------------------------------------

  {
    method: 'get',
    url: '/apps',
    handler: awsJobs.describeJobDefinitions,
  },
  {
    method: 'post',
    url: '/jobs/definitions',
    middleware: [auth.superuser, schema.validateBody(schemas.job.definition)],
    handler: awsJobs.createJobDefinition,
  },
  {
    method: 'delete',
    url: '/jobs/definitions/:appId',
    middleware: [auth.superuser],
    handler: awsJobs.deleteJobDefinition,
  },
  {
    method: 'post',
    url: '/datasets/:datasetId/jobs',
    middleware: [
      auth.datasetAccess(),
      auth.submitJobAccess,
      schema.validateBody(schemas.job.submit),
    ],
    handler: awsJobs.submitJob,
  },
  {
    method: 'post',
    url: '/datasets/jobsupload',
    middleware: [fileUpload(), auth.optional],
    handler: awsJobs.parameterFileUpload,
  },
  {
    method: 'get',
    url: '/datasets/:datasetId/jobs',
    middleware: [auth.datasetAccess({ optional: true })],
    handler: awsJobs.getDatasetJobs,
  },
  {
    method: 'delete',
    url: '/datasets/:datasetId/jobs',
    middleware: [auth.datasetAccess()],
    handler: awsJobs.deleteDatasetJobs,
  },
  {
    method: 'get',
    url: '/datasets/:datasetId/jobs/:jobId',
    middleware: [auth.datasetAccess()],
    handler: awsJobs.getJob,
  },
  {
    method: 'delete',
    url: '/datasets/:datasetId/jobs/:jobId',
    middleware: [auth.datasetAccess(), auth.deleteJobAccess],
    handler: awsJobs.deleteJob,
  },
  {
    method: 'put',
    url: '/datasets/:datasetId/jobs/:jobId',
    middleware: [auth.datasetAccess()],
    handler: awsJobs.cancelJob,
  },
  {
    method: 'post',
    url: '/datasets/:datasetId/jobs/:jobId/retry',
    middleware: [
      auth.datasetAccess(),
      auth.rerunJobAccess,
      auth.submitJobAccess,
    ],
    handler: awsJobs.retry,
  },
  {
    method: 'get',
    url: '/datasets/:datasetId/jobs/:jobId/results/ticket',
    middleware: [auth.datasetAccess()],
    handler: awsJobs.getDownloadTicket,
  },
  {
    method: 'get',
    url: '/jobs',
    middleware: [auth.optional],
    handler: awsJobs.getJobs,
  },
  {
    method: 'get',
    url: '/jobs/:jobId/results/:fileName',
    // middleware: [
    //     auth.ticket
    // ],
    handler: awsJobs.downloadAllS3,
  },
  {
    method: 'get',
    url: '/jobs/:jobId/logs',
    handler: awsJobs.downloadJobLogs,
  },
  {
    method: 'get',
    url: '/logs/:app/:jobId/:taskArn',
    handler: awsJobs.getLogstream,
  },
  {
    method: 'get',
    url: '/logs/:app/:jobId/:taskArn/raw',
    handler: awsJobs.getLogstreamRaw,
  },
  {
    method: 'get',
    url: '/eventlogs',
    middleware: [auth.superuser],
    handler: eventLogs.getEventLogs,
  },

  // comments --------------------------------------
  {
    method: 'get',
    url: '/comments/:datasetId',
    handler: comments.getComments,
  },

  {
    method: 'post',
    url: '/comments/:datasetId',
    middleware: [auth.user],
    handler: comments.create,
  },

  {
    method: 'post',
    url: '/comments/:datasetId/:commentId',
    middleware: [auth.deleteCommentAccess],
    handler: comments.update
  },
  
  {
    method: 'delete',
    url: '/comments/:commentId',
    middleware: [auth.deleteCommentAccess],
    handler: comments.delete,
  },


  // subscriptions ----------------------------------------

  {
    method: 'get',
    url: '/subscriptions/:datasetId',
    middleware: [auth.user],
    handler: subscriptions.getSubscriptions
  },
  {
    method: 'post',
    url: '/subscriptions/:datasetId',
    middleware: [auth.user],
    handler: subscriptions.create
  },
  {
    method: 'delete',
    url: '/subscriptions/:datasetId/:userId',
    middleware: [auth.user],
    handler: subscriptions.delete
  }
]

// initialize routes -------------------------------

const router = express.Router()

for (const route of routes) {
  let arr = route.hasOwnProperty('middleware') ? route.middleware : []
  arr.unshift(route.url)
  arr.push(route.handler)
  router[route.method].apply(router, arr)
}

// export ------------------------------------------

export default router
