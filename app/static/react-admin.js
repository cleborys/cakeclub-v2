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

          $('.alert').fadeIn();
          window.setTimeout(function () {
              $(".alert").fadeOut(); }, 2000);
        });
    }

    render() {
      return (
      <div className="alert alert-danger alert-dismissible" 
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

  handleNextSession(event) {
    socket.emit("create_next_session", {});
    event.preventDefault();
  }

    
  render() {

    return (
    <div id="react-rendered">
      <ErrorToast/>
      <ConnectionToast />

      <div className="btn-group">
        <a type="button" className="btn btn-primary" data-toggle="modal" data-target="#SessionCreationModal">Create Custom Session</a>
        <a type="button" className="btn btn-primary" onClick={this.handleNextSession}>Create Next Session</a>
        <a type="button" className="btn btn-primary" data-toggle="modal" data-target="#UserCreationModal">Create User</a>
      </div>
      <hr/>
      <div className="jumbotron">
          <SessionTable sessions={[]}/>
      </div>

      <SessionCreationModal />
      <UserCreationModal />

    </div>
    )
  }
}

class UserCreationModal extends React.Component {
    constructor(props) {
      super(props);

      this.state = {eaten_offset: 0, baked_offset: 0, future: true};
      this.handleSubmit = this.handleSubmit.bind(this);
      this.changeName = this.changeName.bind(this);
      this.changeMail = this.changeMail.bind(this);
      this.changeEaten = this.changeEaten.bind(this);
      this.changeBaked = this.changeBaked.bind(this);
      this.changeFuture = this.changeFuture.bind(this);
      this.changePassword = this.changePassword.bind(this);
    }

    changeName(event) {
      this.setState({username: event.target.value});
    }
    changeMail(event) {
      this.setState({email: event.target.value});
    }
    changeEaten(event) {
      this.setState({eaten_offset: event.target.value});
    }
    changeBaked(event) {
      this.setState({baked_offset: event.target.value});
    }
    changeFuture(event) {
      this.setState({future: event.target.value});
    }
    changePassword(event) {
      this.setState({password: event.target.value});
    }

    handleSubmit(event) {
      socket.emit("create_user", this.state);
    }

    render() {
      return (
        <div className="modal fade" id="UserCreationModal" tabIndex="-1" role="dialog" >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="UserCreationModalLabel">New User</h5>
                <button type="button" className="close" data-dismiss="modal" >
                  <span >&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <UserCreationForm 
                  onNameChange={this.changeName}
                  onMailChange={this.changeMail}
                  onEatenChange={this.changeEaten}
                  onBakedChange={this.changeBaked}
                  onFutureChange={this.changeFuture}
                  onPasswordChange={this.changePassword}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">
                  Close</button>
                <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>
                  Create User</button>
              </div>
            </div>
          </div>
        </div>
      )
    }
}

class UserCreationForm extends React.Component {
    constructor(props) {
      super(props);
    }


    render() {
      return (
        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <input type="text" className="form-control" id="inputUserName" placeholder="Name" onChange={this.props.onNameChange}/>
            <input type="text" className="form-control" id="inputUserMail" placeholder="Email" onChange={this.props.onMailChange}/>
            <input type="text" className="form-control" id="inputUserEOffset" placeholder="Number of cakes already eaten" onChange={this.props.onEatenChange}/>
            <input type="text" className="form-control" id="inputUserBOffset" placeholder="Number of cakes already baked" onChange={this.props.onBakedChange}/>
            <div className="form-check">
              <input type="checkbox" checked className="form-check-input" id="inputUserFuture" 
                placeholder="Add to future sessions" onChange={this.props.onFutureChange}/>
              <label className="form-check-label" htmlFor="inputUserFuture">
                Add to future sessions </label>
            </div>
            <input type="text" className="form-control" id="inputUserPassword" placeholder="Password" onChange={this.props.onPasswordChange}/>
          </div>
          <div className="form-group">
          </div>
        </form>
      )
    }
}

class SessionCreationModal extends React.Component {
    constructor(props) {
      super(props);

      this.state = {date: ""};
      this.handleSubmit = this.handleSubmit.bind(this);
      this.changeDate = this.changeDate.bind(this);

    }

    changeDate(event) {
      this.setState({date: event.target.value});
    }

    handleSubmit(event) {
      socket.emit("create_session", this.state);
    }

    render() {
      return (
        <div className="modal fade" id="SessionCreationModal" tabIndex="-1" role="dialog" >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="SessionCreationModalLabel">New Session</h5>
                <button type="button" className="close" data-dismiss="modal" >
                  <span >&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <SessionCreationForm onDateChange={this.changeDate}/>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">
                  Close</button>
                <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>
                  Create Session</button>
              </div>
            </div>
          </div>
        </div>
      )
    }
}

class SessionCreationForm extends React.Component {
    constructor(props) {
      super(props);
    }


    render() {
      return (
        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <input type="date" className="form-control" id="inputSessionDate" placeholder="Date of next session" onChange={this.props.onDateChange}/>
          </div>
          <div className="form-group">
          </div>
        </form>
      )
    }
}

class SessionTable extends React.Component{
    constructor(props) {
      super(props);
      this.state = {sessions: []};
    }

    componentDidMount() {
         socket.on("open_sessions", (msg) => 
           {
           this.setState(previousState => ({
                 sessions: msg.data
             }))
            console.log(msg.data)
         });
         
         socket.on("sessions_updated", (msg) =>
           {
            socket.emit("request_sessions");
         });

         socket.emit("request_sessions");
     }

    render() {
      if (this.state.sessions.length == 0){
        return (
          <div>
            <h4 className="card-title text-primary">There are no upcoming sessions.</h4>
          </div>
        )
      } else {
        return (
          <div>
            <h4 className="card-title text-primary">Upcoming Cakeclub Sessions</h4>
            <table className="table table-hover table-sm">
                <thead><tr>
                    <th className="w-10">Date</th>
                    <th className="w-10">Bakers</th>
                    <th className="w-55">Participants</th>
                    <th className="w-25">Actions</th>
                </tr></thead>
                <tbody>
                    {this.state.sessions.map((session) =>
                        <SessionTableRow key={session.session_id} session={session} />
                    ) }
                </tbody>
            </table>
          </div>
        )
      }
    }

}

class SessionTableRow extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      let participants;
      participants = this.props.session.participants.length;

      var baker_names = this.props.session.bakers.map(user => user.username);
      if (this.props.session.bakers.length < this.props.session.max_bakers) {
        baker_names.push("Missing a baker!")
      }


      var members = <div>
        {intersperse(this.props.session.participants.map(user => user.username),
          ", ") }
      </div>;

      var bakers = <div>
        {intersperse(baker_names, ", ") }
      </div>;

      return (
        <tr>
          <td> {this.props.session.date} </td>
          <td> {bakers} </td>
          <td> Expecting {participants} attendees.</td>
          <td> <SessionTableActions session={this.props.session} /> </td>
        </tr>
      );
    }
}

class SessionTableActions extends React.Component {
    constructor(props) {
      super(props);

      this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete(event) {
      socket.emit("delete_session", this.props.session.session_id);
      event.preventDefault();
    }

    render() {
      let deleteButton;
      deleteButton = (
          <button className="btn btn-warning" onClick={this.handleDelete}> Delete </button>
      );

      return (
        <div className="btn-group">
          {deleteButton}
        </div>
      )
    }
}

ReactDOM.render(
    <App />,
    document.getElementById("react-root")
);

function intersperse(arr, sep) {
    if (arr.length === 0) {
        return [];
    }

    return arr.slice(1).reduce(function(xs, x, i) {
        return xs.concat([sep, x]);
    }, [arr[0]]);
}
