const socket = io("/game")

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

class App extends React.Component {
  constructor(props) {
    super(props);
    this.handleNewGame = this.handleNewGame.bind(this);
    this.state = {my_id: null, game: {player_asking: {}, players: [{name: null, player_id: null, hand: []}], current_player: {}}};
    this.player_is_me = this.player_is_me.bind(this);
    socket.on("game_info", (msg) =>
      {
        console.log("got game info");
        console.log(msg);

        this.setState(previousState => (
          {
            game: previousState.game,
            game_id: msg.game_id,
            game_token: msg.game_token,
            my_id: msg.my_id,
          }));
      });
    socket.on("game_update", (msg) =>
      {
        console.log("got game update");
        console.log(msg);
        this.setState(previousState => (
          {
            game: msg.data,
            game_id: previousState.game_id,
            game_token: previousState.game_token,
            my_id: previousState.my_id,
          }));
      });
  }


  handleNewGame(event) {
    socket.emit("create_room", {name: "react_game"});
  }

  player_is_me(player) {
    return ( player.player_id == this.state.my_id )
  }
    
  render() {
    let me; 
    me = this.state.game.players.find(this.player_is_me);

    let card_choice;
    if (typeof me !== 'undefined'){
      card_choice = (
        <CardChoiceModal 
        state_asked_for={this.state.game.state_asked_for} 
        hand={me.hand}/>
      )
    }

    return (
    <div id="react-rendered">
      <div className="jumbotron">
        <div className="row">
          <div className="col-md-6 text-center center-block" >
            <GameStatus game={this.state.game} my_id={this.state.my_id}/>
          </div>
          <div className="col-md-6 text-center center-block" >
            <hr className="hidden-md hidden-lg" />
            <DecisionMaker game={this.state.game} my_id={this.state.my_id}/>
          </div>
        </div>
        <hr/>
        <div className="row">
          <div className="col-md-6" >
            <VictoryButton />
          </div>
        </div>
      </div>
      <PlayerArea players={this.state.game.players} my_id={this.state.my_id}/>

      {card_choice}

      <VictoryModal my_id={this.state.my_id}/>

      <ErrorToast />
      <ConnectionToast />

    </div>
    )
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
        </div>
      </div>
      );
    }
}

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

          $('#GameErrorAlert').fadeIn();
          window.setTimeout(function () {
              $("#GameErrorAlert").fadeOut(); }, 2000);
        });
    }

    render() {
      return (
      <div className="alert alert-danger alert-dismissible" 
        id="GameErrorAlert"
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

class PlayerName extends React.Component{
  render() { 
    if (this.props.player.player_id == this.props.my_id) {
      return (
      <span className="badge">You</span>
      )
    } else {
      return (
      <span className="badge">{this.props.player.name}</span>
      )
    }
  }
}

class GameStatus extends React.Component{
    constructor(props) {
      super(props);
    }

  render(){
    let activity;
    if (this.props.game.phase == "ASKING") {
      activity = <span> asking a question.</span>
    } else {
      activity = <span> 
        answering  a question 
      by <PlayerName player={this.props.game.player_asking} my_id={this.props.my_id}/> about 
      state <StateName state_id={this.props.game.state_asked_for} />
      </span>
    }

    let verb;
    if (this.props.game.current_player.player_id === this.props.my_id) {
      verb = <span> are </span>
    } else {
      verb = <span> is </span>
    }

    return(
        <p>
        <PlayerName player={this.props.game.current_player} my_id={this.props.my_id} /> {verb} {activity}
        </p>
    );
  }
}

class CardChoiceModal extends React.Component{
    constructor(props) {
      super(props);

      this.state = {card_id: null};
      this.handleSubmit = this.handleSubmit.bind(this);
      this.selectCard = this.selectCard.bind(this);
      this.renderChoiceCard = this.renderChoiceCard.bind(this);

    }

    handleSubmit(event) {
      socket.emit("answer_state_question", {
        i_have_the_card: true,
        card_id: this.state.card_id,
      });
    }

    selectCard(selected_card_id) {
      this.setState({card_id: selected_card_id});
    }

    renderChoiceCard(card) {

    let styling;
    if (card.id === this.state.card_id) {
      styling = "btn btn-primary";
    } else {
      styling = "btn btn-default";
    }
      return (
        <button type="button" className={styling} key={card.id}
        onClick={ () => this.selectCard(card.id) }>
          <PlayingCard key={card.id} id={card.id} possible_states={card.states} />
        </button>
      );
    }

    render() {
      return (
        <div className="modal fade" id="CardChoiceModal" tabIndex="-1" role="dialog" >
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="CardChoiceModalLabel">
                  Which card is of state <StateName state_id={this.props.state_asked_for} />?
                </h5>
                <button type="button" className="close" data-dismiss="modal" >
                  <span >&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="container col-12">
                    <div className="btn-group">
                      {this.props.hand.map( this.renderChoiceCard ) }
                    </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">
                  Close
                </button>
                <button type="button" className="btn btn-primary"  
                  data-dismiss="modal" onClick={this.handleSubmit}>
                  Pass card
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
}

class VictoryModal extends React.Component{
    constructor(props) {
      super(props);

      this.state = {winning_players: [], losing_players: [{player_id: 0}]};
      this.handleSubmit = this.handleSubmit.bind(this);

    }

   componentDidMount() {
        socket.on("game_outcome", (msg) => 
          {
          this.setState(previousState => ({
                winning_players: msg.data.winning_players,
                losing_players: msg.data.losing_players,
                claim_correct: msg.data.claim_correct,
            }));

          $('#VictoryModal').modal({backdrop: "static", keyboard: false});
        });
    }

    handleSubmit(event) {
      socket.emit("continue_anyways");
    }

    render() {
        let reason_win;
        let reason_lose;
        if (this.state.claim_correct) {
          reason_win = <span> because they must currently hold four cards of a single suit.</span>
        } else {
          reason_lose = <span> because they incorrectly claimed they would have won.</span>
        }
      return (
        <div className="modal fade" id="VictoryModal" tabIndex="-1" role="dialog" >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="VictoryModalLabel">
                  The game has ended!
                </h5>
              </div>
              <div className="modal-body">
                <div className="container">
                  <div>
                    The following players win: {this.state.winning_players.map((player) =>
                        <PlayerName 
                          key={player.player_id} 
                          player={player}
                          my_id={this.props.my_id}
                        />
                    ) }
                    {reason_win}
                    <br/>
                    The following players lose: {this.state.losing_players.map((player) =>
                        <PlayerName 
                          key={player.player_id} 
                          player={player}
                          my_id={this.props.my_id}
                        />
                    ) }
                    {reason_lose}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary"  
                  data-dismiss="modal" onClick={this.handleSubmit}>
                  Continue anyways...
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
}

class DecisionMaker extends React.Component{
    constructor(props) {
      super(props);
      this.handleNegative = this.handleNegative.bind(this);
    }

  handleNegative(event) {
    socket.emit("answer_state_question", {
      i_have_the_card: false,
      card_id: null,
    });
    event.preventDefault();
  }
  render() { 
    let content;
    if (this.props.game.phase == "ASKING" && this.props.game.current_player.player_id == this.props.my_id){
      content = (
        <AskInterface players={this.props.game.players} my_id={this.props.my_id}/>
      )
    } else if (this.props.game.phase == "ANSWERING" && this.props.game.current_player.player_id == this.props.my_id){
      content = (
        <div className="btn-group">
          <button type="button" className="btn btn-success" 
          data-toggle="modal" data-target="#CardChoiceModal">
                I have the card!
          </button>
          <button type="button" className="btn btn-danger" 
            onClick={this.handleNegative}>
            I don't have the card!
          </button>
        </div>
      )
    } else {
      content = (
        <p>Waiting for your turn...</p>
      )
    }
    return (
      <div> {content} </div>
  )}
}

class VictoryButton extends React.Component{

  render() {
    return (
    <button type="button" className="btn btn-primary"
      onClick={() => socket.emit("claim_victory")}>
      Claim Victory!
    </button>
    );
  }
}

class StateName extends React.Component{

  render() {
    const state_names = {
      0: "A1",
      1: "A2",
      2: "A3",
      3: "A4",
      4: "B1",
      5: "B2",
      6: "B3",
      7: "B4",
      8: "C1",
      9: "C2",
      10: "C3",
      11: "C4",
    };
    return (
      <span> {state_names[this.props.state_id]} </span>
    );
  }

  }


class AskInterface extends React.Component{
  constructor(props){
    super(props)
    this.handleAsking = this.handleAsking.bind(this);
    this.renderPlayerButton = this.renderPlayerButton.bind(this);
    this.renderStateButton = this.renderStateButton.bind(this);
    this.state = {player_to_ask: null, state_to_ask: null}
    if (this.props.players.length == 2) {
      if (this.props.players[0].player_id != this.props.my_id) {
        this.state = {player_to_ask: this.props.players[0].player_id, state_to_ask: null}
      } else {
        this.state = {player_to_ask: this.props.players[1].player_id, state_to_ask: null}
      }
    }
  }

  handleAsking(event) {
    socket.emit("ask_for_state", {
      asked_player: this.state.player_to_ask,
      state_id: this.state.state_to_ask,
    });
    event.preventDefault();
  }

  handlePlayerChoice(player_id) {
    this.setState( {player_to_ask: player_id} )
  }

  handleStateChoice(state_id) {
    this.setState( {state_to_ask: state_id} )
  }

  renderPlayerButton(player) { 
    if (player.player_id == this.props.my_id){
      return null;
    }
    let styling;
    if (player.player_id === this.state.player_to_ask) {
      styling = "btn btn-primary";
    } else {
      styling = "btn btn-default";
    }
    return(
    <button type="button" className={styling}
      key={player.player_id}
      onClick={() => this.handlePlayerChoice(player.player_id)}>
      <PlayerName player={player} my_id={this.props.my_id}/>
    </button>
  );}

  renderStateButton(state_id) {
    let styling;
    if (state_id === this.state.state_to_ask) {
      styling = "btn btn-primary";
    } else {
      styling = "btn btn-default";
    }
    return(
    <button type="button" className={styling}
      key={state_id}
      onClick={() => this.handleStateChoice(state_id)}>
      <StateName state_id={state_id} />
    </button>
  );}

  render() {
      var player_buttons = (
        <div className="btn-group">
        {this.props.players.map((player) => this.renderPlayerButton(player))}
        </div>
      )
      var state_buttons = (
        <span>
          <div className="btn-group-vertical">
            {[0,1,2,3].map( (state_id) => this.renderStateButton(state_id))}
          </div>
          <div className="btn-group-vertical">
            {[4,5,6,7].map( (state_id) => this.renderStateButton(state_id))}
          </div>
          <div className="btn-group-vertical">
            {[8,9,10,11].map( (state_id) => this.renderStateButton(state_id))}
          </div>
        </span>

      )
    return (
      <div>
      Ask {player_buttons} for {state_buttons} <button type="button" className="btn btn-success" onClick={this.handleAsking}>Ask!</button>
      </div>
    );
  }
}

class PlayerArea extends React.Component{

  render() { return (
    <div >
        {this.props.players.map((player) =>
            <div className="col-md-6" key={player.player_id}>
              <Player key={player.player_id} player={player} hand={player.hand} my_id={this.props.my_id}/>
            </div>
        ) }
    </div>
  )}
}

class Player extends React.Component{
    constructor(props) {
      super(props);
    }

  render() { return (
    <div className="panel panel-primary">
      <div className="panel-heading">
        <PlayerName player={this.props.player} my_id={this.props.my_id} />
      </div>
      <div className="panel-body">
        <div className="container">
          <div className="row">
            {this.props.hand.map((card) =>
                <PlayingCard key={card.id} id={card.id} possible_states={card.states} />
            ) }
          </div>
        </div>
      </div>
    </div>
  )}
}

class PlayingCard extends React.Component{
    constructor(props) {
      super(props);
    }

    componentDidMount() {
        $('[data-toggle="tooltip"]').tooltip({
          html: true
        });
    }


    render() {
      var num_of_states = this.props.possible_states.reduce((a, b) => a + b, 0);
      var opac = 6 / num_of_states;
      const state_names = {
        0: "A1",
        1: "A2",
        2: "A3",
        3: "A4",
        4: "B1",
        5: "B2",
        6: "B3",
        7: "B4",
        8: "C1",
        9: "C2",
        10: "C3",
        11: "C4",
      };
      var possible_state_names = [];
      for (let i =0; i < 12; i++) {
        if (this.props.possible_states[i] == 1){
           possible_state_names.push(state_names[i]);
        } else {
           possible_state_names.push("XX");
        }

      }
      var magnification = "<div>" + possible_state_names.slice(0,4).toString() 
        + "<br/>"
        + possible_state_names.slice(4,8).toString() 
        + "<br/>"
        + possible_state_names.slice(8,12).toString() 
        + "</div>"

      return (
      <div className="popup-window" 
        style={{position:"relative", width: "100px", float: "left", padding: "1px"}}
        data-container="body" data-toggle="tooltip" data-placement="top"
        data-content="" data-original-title="" 
        title={magnification}
        title_replacement=' <div style="position:relative;width:126px;float:left;padding:1px"><img src="/static/images/cards/0.png" style={{position: "relative", top: 0, left: 0, opacity: this.props.possible_states[0] * opac}} width="120px" height="auto"/> <img src="/static/images/cards/1.png" style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[1] * opac}} width="100%" height="auto"/> <img src="/static/images/cards/2.png" style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[2] * opac}} width="100%" height="auto"/> <img src="/static/images/cards/3.png" style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[3] * opac}} width="10%" height="auto"/> <img src="/static/images/cards/4.png" style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[4] * opac}} width="100%" height="auto"/> <img src="/static/images/cards/5.png" style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[5] * opac}} width="100%" height="auto"/> <img src="/static/images/cards/6.png" style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[6] * opac}} width="100%" height="auto"/> <img src="/static/images/cards/7.png" style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[7] * opac}} width="100%" height="auto"/> <img src="/static/images/cards/8.png" style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[8] * opac}} width="100%" height="auto"/> <img src="/static/images/cards/9.png" style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[9] * opac}} width="100%" height="auto"/> <img src="/static/images/cards/10.png" style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[10] * opac}} width="100%" height="auto"/> <img src="/static/images/cards/11.png" style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[11] * opac}} width="100%" height="auto"/> </div>'>
        <img src="/static/images/cards/back.png" 
          style={{position: "relative", top: 0, left: 0, }} width="100%" height="auto"/>
        <img src="/static/images/cards/0.png" 
          style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[0] * opac}} width="100%" height="auto"/>
        <img src="/static/images/cards/1.png" 
          style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[1] * opac}} width="100%" height="auto"/>
        <img src="/static/images/cards/2.png" 
          style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[2] * opac}} width="100%" height="auto"/>
        <img src="/static/images/cards/3.png" 
          style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[3] * opac}} width="100%" height="auto"/>
        <img src="/static/images/cards/4.png" 
          style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[4] * opac}} width="100%" height="auto"/>
        <img src="/static/images/cards/5.png" 
          style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[5] * opac}} width="100%" height="auto"/>
        <img src="/static/images/cards/6.png" 
          style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[6] * opac}} width="100%" height="auto"/>
        <img src="/static/images/cards/7.png" 
          style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[7] * opac}} width="100%" height="auto"/>
        <img src="/static/images/cards/8.png" 
          style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[8] * opac}} width="100%" height="auto"/>
        <img src="/static/images/cards/9.png" 
          style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[9] * opac}} width="100%" height="auto"/>
        <img src="/static/images/cards/10.png" 
          style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[10] * opac}} width="100%" height="auto"/>
        <img src="/static/images/cards/11.png" 
          style={{position: "absolute", top: 0, left: 0, opacity: this.props.possible_states[11] * opac}} width="100%" height="auto"/>
      </div>
    )}

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
