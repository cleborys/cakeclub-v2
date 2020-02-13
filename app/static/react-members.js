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

    
  render() {

    return (
    <div id="react-rendered">
      <ErrorToast/>
      <ConnectionToast />

      <div className="jumbotron">
          <MemberTable users={[]}/>
      </div>
    </div>
    )
  }
}

class MemberTable extends React.Component{
    constructor(props) {
      super(props);
      this.state = {users: []};
    }

    componentDidMount() {
         socket.on("member_list", (msg) => 
           {
           this.setState(previousState => ({
                 users: msg.data
             }))
            console.log(msg.data)
         });
         
         socket.emit("request_members");
     }

    render() {
      if (this.state.users.length == 0){
        return (
          <div>
            <h4 className="card-title text-primary">There is no-one around...</h4>
          </div>
        )
      } else {
        return (
          <div>
            <h4 className="card-title text-primary">Cakeclub Members</h4>
            <table className="table table-hover table-sm">
                <thead><tr>
                    <th className="w-40">Name</th>
                    <th className="w-20"># cakes baked</th>
                    <th className="w-20"># cakes eaten</th>
                    <th className="w-20">quota</th>
                </tr></thead>
                <tbody>
                    {this.state.users.map((user) =>
                        <MemberTableRow key={user.user_id} user={user} />
                    ) }
                </tbody>
            </table>
          </div>
        )
      }
    }

}

class MemberTableRow extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      let nbr_participated;
      nbr_participated = this.props.user.eaten

      let nbr_baked;
      nbr_baked = this.props.user.baked

      let quota;
      quota = this.props.user.quota

      return (
        <tr>
          <td> {this.props.user.username} </td>
          <td> {nbr_baked} </td>
          <td> {nbr_participated} </td>
          <td> {quota} </td>
        </tr>
      );
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
