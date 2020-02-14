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

  handleNewSession(event) {
    socket.emit("create_session", {});
    event.preventDefault();
  }

    
  render() {

    return (
    <div id="react-rendered">
      <ErrorToast/>
      <ConnectionToast />

      <button type="button" className="btn btn-primary" onClick={this.handleNewSession}>New Session</button>
      <hr/>
      <div className="jumbotron">
          <SessionTable sessions={[]}/>
      </div>
    </div>
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
