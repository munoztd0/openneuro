// dependencies -------------------------------------------------------

import React from 'react'
import PropTypes from 'prop-types'
import Tooltip from '../partials/tooltip.jsx'
import { toast } from 'react-toastify'
import ToastContent from '../partials/toast-content.jsx'

class WarnButton extends React.Component {
  constructor() {
    super()
    this.state = {
      displayOptions: false,
      link: null,
      loading: false,
    }
  }

  // life cycle events --------------------------------------------------

  componentDidMount() {
    this._mounted = true
  }

  componentWillUnmount() {
    this._mounted = false
  }

  render() {
    let displayOptions = this.state.displayOptions
    let message = this.props.message
    let cancel = this.props.cancel
    let confirm = this.props.confirm

    // check for bad validations and add disabled class
    let disabled = false
    if (this.props.validations) {
      for (let i = 0; i < this.props.validations.length; i++) {
        let validation = this.props.validations[i]
        if (validation.check) {
          disabled = true
        }
      }
    }

    let link
    if (this.state.link) {
      link = (
        <a
          className="btn-warn-component success"
          onClick={this.toggle.bind(this, this.props.action)}
          href={this.state.link}>
          {confirm}
        </a>
      )
    }

    let confirmBtn = (
      <button
        className={'btn-warn-component success'}
        onClick={this.toggle.bind(this, this.props.action)}>
        {confirm}
      </button>
    )

    let viewAction = (
      <span className="btn-group slide-in-right-fast" role="group">
        <button
          className="btn-warn-component cancel"
          onClick={this.toggle.bind(this)}>
          {cancel}
        </button>
        {link ? link : confirmBtn}
      </span>
    )

    let hideAction
    hideAction = (
      <span className={disabled ? ' disabled' : ''}>
        <button
          className="btn-warn-component warning"
          onClick={this.toggle.bind(this, this.props.action)}
          disabled={this.props.lock}>
          <i className={'fa ' + this.props.icon} /> {message}
        </button>
      </span>
    )

    let button = displayOptions ? viewAction : hideAction
    let loading = (
      <span className="btn-warn-load" role="group">
        <span className="warning-loading">
          <i className="fa fa-spin fa-circle-o-notch" />
        </span>
      </span>
    )

    if (this.props.tooltip) {
      return (
        <Tooltip tooltip={this.props.tooltip}>
          {this.state.loading ? loading : button}
        </Tooltip>
      )
    }

    return this.state.loading ? loading : button
  }

  // custom methods -----------------------------------------------------

  toggle(action) {
    // initial click actions
    if (this.state.displayOptions == false) {
      // validate & warn
      if (this.props.validations) {
        for (let i = 0; i < this.props.validations.length; i++) {
          let validation = this.props.validations[i]
          if (validation.check) {
            toast.error(
              <ToastContent
                title={validation.type}
                body={validation.message}
              />,
              { autoClose: validation.timeout ? validation.timeout : 5000 },
            )
            return
          }
        }
      }

      // generate download links
      if (this.props.prepDownload) {
        this.setState({ loading: true })
        this.props.prepDownload(link => {
          this.setState({ displayOptions: true, link: link, loading: false })
        })
        return
      }

      if (!this.props.warn) {
        // Wait 250ms before bothering to render loading
        const waitLoading = setTimeout(() => {
          this.setState({ loading: true })
        }, 250)
        action(() => {
          clearTimeout(waitLoading)
          if (this._mounted) {
            this.setState({ loading: false })
          }
        })
        return
      } else {
        this.setState({ displayOptions: true })
        return
      }
    }

    if (typeof action === 'function') {
      this.setState({ loading: true })
      action(e => {
        if (e && e.error) {
          toast.error(<ToastContent title="Error" body={e.error} />)
        }
        if (this._mounted) {
          this.setState({
            loading: false,
            displayOptions: !this.state.displayOptions,
          })
        }
      })
    } else {
      this.setState({ displayOptions: !this.state.displayOptions })
    }
  }
}

WarnButton.propTypes = {
  message: PropTypes.string,
  icon: PropTypes.string,
  warn: PropTypes.bool,
  tooltip: PropTypes.string,
  link: PropTypes.string,
  cancel: PropTypes.object,
  confirm: PropTypes.object,
  validations: PropTypes.array,
  action: PropTypes.func,
  prepDownload: PropTypes.func,
  lock: PropTypes.bool,
  modalLink: PropTypes.string,
  location: PropTypes.object,
}

WarnButton.defaultProps = {
  message: '',
  cancel: <i className="fa fa-times" />,
  confirm: <i className="fa fa-check" />,
  icon: 'fa-trash-o',
  warn: true,
  tooltip: null,
}

export default WarnButton
