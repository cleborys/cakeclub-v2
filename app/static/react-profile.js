const socket = io()

window.setInterval( () => {
  if (socket.connected) {
    $('#ConnectionAlert').fadeOut();
  } else {
    $('#ConnectionAlert').fadeIn();
  }
}, 1000);

socket.on("connect", () => {
    $('#ConnectionAlert').fadeOut();
});

class ErrorToast extends React.Component{
    constructor(props) {
      super(props);
      this.state = {error: "empty error message" }
    }

   componentDidMount() {
        socket.on("error_msg", (msg) => 
          {
          console.log("received error")
          console.log(msg)
          this.setState(previousState => ({
                error: msg.data
            }))

          $('#ErrorToast').fadeIn();
          window.setTimeout(function () {
              $("#ErrorToast").fadeOut(); }, 3000);
        });
    }

    render() {
      return (
      <div id="ErrorToast" className="alert alert-danger alert-dismissible" 
        style={{top: 100, right:10, position:"absolute", display:"none"}} 
        >
          <strong className="mr-auto">Error</strong>
          <button type="button" className="ml-2 mb-1 close" data-dismiss="alert" >
            <span >&times;</span>
          </button>
        <div >
        {this.state.error}
        </div>
      </div>
      );
    }
}

class PasswordToast extends React.Component{
    constructor(props) {
      super(props);
    }

   componentDidMount() {
        socket.on("password_success", (msg) => 
          {
          $('#PasswordToast').fadeIn();
          window.setTimeout(function () {
              $("#PasswordToast").fadeOut(); }, 3000);
        });
    }

    render() {
      return (
      <div id="PasswordToast" className="alert alert-success alert-dismissible" 
        style={{top: 100, right:10, position:"absolute", display:"none"}} 
        >
          <strong className="mr-auto">Password Changed</strong>
          <button type="button" className="ml-2 mb-1 close" data-dismiss="alert" >
            <span >&times;</span>
          </button>
        <div >
        Successfully changed your password.
        </div>
      </div>
      );
    }
}

class ConnectionToast extends React.Component{
    constructor(props) {
      super(props);
    }

    render() {
      return (
      <div className="alert alert-warning alert-dismissible" 
        id="ConnectionAlert"
        style={{top: 100, right:10, position:"absolute", display:"none"}} 
        >
          <strong className="mr-auto">Lost Connection</strong>
          <button type="button" className="ml-2 mb-1 close" data-dismiss="alert" >
            <span >&times;</span>
          </button>
        <div >
        <p>You appear to have lost connection to the Server.</p>
        <p>If you don't reconnect within ten seconds, try refreshing the page.</p>
        </div>
      </div>
      );
    }
}

class App extends React.Component {
  constructor(props) {
    super(props);
  }

    
  render() {

    return (
    <div id="react-rendered">
      <ErrorToast/>
      <PasswordToast/>
      <ConnectionToast />
      <PasswordModal />

      <div className="jumbotron">
          <UserStatus user={{username: "Username", email: "Email", is_active: false}}/>
      </div>
    </div>
    )
  }
}

class UserStatus extends React.Component{
    constructor(props) {
      super(props);
      this.state = {user: {}};
    }

    componentDidMount() {
         socket.on("current_user", (msg) => 
           {
           this.setState(previousState => ({
                 user: msg.data
             }))
            console.log(msg.data)
         });
         
         socket.emit("request_status");
     }

    render() {
        return (
          <div>
            <h4 className="card-title text-primary">Your Profile</h4>
            <table className="table table-hover table-sm">
              <thead><tr>
                  <th className="w-30"></th>
                  <th className="w-70"></th>
              </tr></thead>
            <tbody>
              <tr>
                <td>Username:</td>
                <td>{this.state.user.username}</td>
              </tr>
              <tr>
                <td>Email:</td>
                <td>{this.state.user.email}</td>
              </tr>
              <tr>
                <td>Status:</td>
                <td> <ActiveButton status={this.state.user.is_active}/> </td>
              </tr>
              <tr>
                <td>Password:</td>
                <td>
                  <a type="button" className="btn btn-default btn-sm" data-toggle="modal" data-target="#ChangePasswordModal">Change Password</a>
                </td>
              </tr>
            </tbody>
            </table>
          </div>
        )
    }
}

class ActiveButton extends React.Component {
    constructor(props) {
      super(props);

      this.state = {is_active: false};
      this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
      this.state.is_active = !(this.state.is_active)
      socket.emit("set_active", this.state.is_active);
    }

    componentDidMount() {
         socket.on("current_user", (msg) => 
           {
           this.setState(previousState => ({
                 is_active: msg.data.is_active
             }))
         });
     }

    render() {
      if (this.state.is_active) {
        return (
          <button type="button" className="btn btn-sm btn-success" onClick={this.handleSubmit}>
            Active</button>
        )
      } else {
        return (
          <button type="button" className="btn btn-sm btn-danger" onClick={this.handleSubmit}>
            Inactive</button>
        )
      }
    }
}

class PasswordModal extends React.Component {
    constructor(props) {
      super(props);

      this.state = {old_password: "", new_password: "", new_password_repeat: ""};
      this.handleSubmit = this.handleSubmit.bind(this);
      this.changeOld = this.changeOld.bind(this);
      this.changeNew = this.changeNew.bind(this);
      this.changeNewRepeat = this.changeNewRepeat.bind(this);
    }

    changeOld(event) {
      this.setState({old_password: event.target.value});
    }
    changeNew(event) {
      this.setState({new_password: event.target.value});
    }
    changeNewRepeat(event) {
      this.setState({new_password_repeat: event.target.value});
    }

    handleSubmit(event) {
      socket.emit("change_password", this.state);
      $('#ChangePasswordModal').modal('hide');
    }

    render() {
      return (
        <div className="modal fade" id="ChangePasswordModal" tabIndex="-1" role="dialog" >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="ChangePasswordModalLabel">Change Your Password</h5>
                <button type="button" className="close" data-dismiss="modal" >
                  <span >&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <PasswordForm 
                  onOldChange={this.changeOld}
                  onNewChange={this.changeNew}
                  onNewRChange={this.changeNewRepeat}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">
                  Close</button>
                <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>
                  Change Password</button>
              </div>
            </div>
          </div>
        </div>
      )
    }
}

class PasswordForm extends React.Component {
    constructor(props) {
      super(props);
    }


    render() {
      return (
        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="inputOld">
              Current Password:</label>
            <input type="password" className="form-control" id="inputOld" 
              placeholder="Enter your current Password" onChange={this.props.onOldChange}/>

            <label className="form-label" htmlFor="inputOld">
              New Password:</label>
            <input type="password" className="form-control" id="inputNew" 
              placeholder="Enter a new Password" onChange={this.props.onNewChange}/>
            <input type="password" className="form-control" id="inputNewR" 
              placeholder="Repeat your new Password" onChange={this.props.onNewRChange}/>
          </div>
        </form>
      )
    }
}


ReactDOM.render(
    <App />,
    document.getElementById("react-root")
);
