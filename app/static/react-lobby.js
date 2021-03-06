const socket = io()

window.setInterval( () => {
  if (socket.connected) {
    $('#ConnectionAlert').fadeOut();
  } else {
    $('#ConnectionAlert').fadeIn();
  }
}, 2000);

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

  handleNewGame(event) {
    socket.emit("create_session", {});
    event.preventDefault();
  }

    
  render() {

    return (
    <div id="react-rendered">
      <ErrorToast/>
      <ConnectionToast />

      <div className="jumbotron">
        <BakeCard sessions={[]}/>
      </div>
      <hr/>
      <div className="jumbotron">
        <SessionTable sessions={[]}/>
      </div>
    </div>
    )
  }
}

class BakeCard extends React.Component{
  constructor(props) {
    super(props);
    this.state = {sessions: [], received_data: false};
  }

 componentDidMount() {
      socket.on("open_sessions", (msg) => 
        {
          let baking_sessions;
          baking_sessions = msg.data.filter(session => session.i_am_baking)
        this.setState(previousState => ({
              sessions: baking_sessions,
              received_data: true,
          }))
      });
  }

  render() {

    let content;
    if (!this.state.received_data) {
      content = <div className="lds-ring"><div></div><div></div><div></div><div></div></div>
    }
    else if (this.state.sessions.length === 0){
      content = <div> You have no upcoming baking sessions. Pick one below! </div>
    } else {
      content = (
        <div>
          <p> Be prepared! Here are your upcoming baking sessions: </p>
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
      );
    }

    return (
        <div className="card border-danger h-100">
          <div className="card-body d-flex flex-column justify-content-center">
              <h4 className="card-title text-primary"> Upcoming baking sessions</h4>
              {content}
          </div>
        </div>
    );
  }
}

class SessionTable extends React.Component{
    constructor(props) {
      super(props);
      this.state = {sessions: [], received_data: false};
    }

    componentDidMount() {
         socket.on("open_sessions", (msg) => 
           {
             this.setState(previousState => ({
                 sessions: msg.data,
                 received_data: true,
             }));
             console.log("received sessions");
             console.log(msg);
            clearInterval(this.refresher);
         });
         
         socket.on("sessions_updated", (msg) =>
           {
            socket.emit("request_sessions");
         });

         socket.emit("request_sessions");
         this.refresher = window.setInterval( () => {
           socket.emit("request_sessions");
           console.log("refreshing...")
         }, 5000);
     }

    render() {
      if (!this.state.received_data){
        return(
          <div>
            <h4 className="card-title text-primary">Upcoming Cakeclub Sessions</h4>
            <div className="lds-ring"><div></div><div></div><div></div><div></div></div>
          </div>
        )
      }
      else if (this.state.sessions.length == 0){
        return (
          <div>
            <h4 className="card-title text-primary">Upcoming Cakeclub Sessions</h4>
            There are no upcoming sessions.
          </div>
        )
      } else {
        return (
          <div>
            <h4 className="card-title text-primary">Upcoming Cakeclub Sessions</h4>
            <table className="table table-hover table-sm">
                <thead><tr>
                    <th className="w-10">Date</th>
                    <th className="w-10">Baker</th>
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

    componentDidMount() {
        $('[data-toggle="popover"]').popover({
          container: "body",
          trigger: "focus",
          html: true,
        });
    }

    render() {
      var baker_names = this.props.session.bakers.map(user => user.username);
      if (this.props.session.bakers.length < this.props.session.max_bakers) {
        baker_names.push(<span key="1" className="label label-danger">Missing a baker!</span>)
      }


      var member_list = this.props.session.participants.map(user => 
          "<div>" + user.username + "</div>"
      ).join("");

      var bakers = <div>
        {intersperse(baker_names, ", ") }
      </div>;


      var participants = <a tabIndex="0" data-toggle="popover" data-placement="bottom" data-content={member_list} >
        {this.props.session.participants.length}
      </a>;

      return (
        <tr>
          <td> {this.props.session.date} </td>
          <td> {bakers} </td>
          <td> Expecting {participants}.</td>
          <td> <SessionTableActions session={this.props.session} /> </td>
        </tr>
      );
    }
}

class SessionTableActions extends React.Component {
    constructor(props) {
      super(props);

      this.handleJoin = this.handleJoin.bind(this);
      this.handleLeave = this.handleLeave.bind(this);
      this.handleBecomeBaker = this.handleBecomeBaker.bind(this);
    }

    handleJoin(event) {
      socket.emit("join_session", this.props.session.session_id);
      event.preventDefault();
    }
    handleLeave(event) {
      socket.emit("leave_session", this.props.session.session_id);
      event.preventDefault();
    }
    handleBecomeBaker(event) {
      socket.emit("become_baker", this.props.session.session_id);
      event.preventDefault();
    }

    render() {
      let joinLeaveButton;
      if (this.props.session.i_am_participating) {
        joinLeaveButton = (
          <button className="btn btn-warning" onClick={this.handleLeave}> Leave </button>
        );
      } else {
        joinLeaveButton = (
          <button className="btn btn-default" onClick={this.handleJoin}> Join </button>
        );
      }

      let bakeButton;
      if (this.props.session.i_am_baking) {
      }
      else if (this.props.session.bakers.length < this.props.session.max_bakers) {
        bakeButton = (
          <button className="btn btn-success" onClick={this.handleBecomeBaker}> Bake </button>
        );
      }
      return (
        <div className="btn-group">
          {bakeButton}
          {joinLeaveButton}
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
