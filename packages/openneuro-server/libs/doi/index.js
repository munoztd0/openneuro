import request from 'superagent'
import config from '../../config'
import templates from './templates'

/**
 * @param {Object} doiConfig
 * @param {string} doiConfig.username DOI service username
 * @param {string} doiConfig.password DOI service password
 */
export const formatBasicAuth = doiConfig =>
  'Basic ' +
  Buffer.from(doiConfig.username + ':' + doiConfig.password).toString('base64')

export default {
  auth: formatBasicAuth(config.doi),
  createDOI(accNumber, snapshotId) {
    let doi = config.doi.prefix + '/openneuro.' + accNumber
    if (snapshotId) {
      doi = doi + '.v' + snapshotId
    }
    return doi
  },

  async mintDOI(doi, url) {
    return await request
      .put(config.doi.url + 'doi/' + doi)
      .set('Authorization', this.auth)
      .set('Content-Type', 'text/plain;charset=UTF-8')
      .send('doi=' + doi + '\nurl=' + url)
  },

  async registerMetadata(context) {
    let xml = templates['metadata'](context)
    return request
      .post(config.doi.url + 'metadata/')
      .set('Authorization', this.auth)
      .set('Content-Type', 'application/xml;charset=UTF-8')
      .send(xml)
  },

  async registerSnapshotDoi(datasetId, snapshotId, oldDesc) {
    let url, context
    let baseDoi = this.createDOI(datasetId, snapshotId)
    url = `https://openneuro.org/datasets/${datasetId}/versions/${snapshotId}`
    context = {
      doi: baseDoi,
      creators: oldDesc.Authors.filter(x => x),
      title: oldDesc.Name,
      year: new Date().getFullYear(),
      resourceType: 'fMRI',
    }
    return this.registerMetadata(context)
      .then(async () => {
        return this.mintDOI(baseDoi, url)
      })
      .then(async () => {
        return baseDoi
      })
      .catch(() => {
        return null
      })
  },
}
