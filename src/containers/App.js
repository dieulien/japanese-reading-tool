import React, { Component } from "react";
import { connect } from "react-redux";
import CharList from "./CharList";
import CharInput from "./CharInput";
import NavBar from "../components/NavBar";
import Hint from "../components/Hint";
import { FormControl, Grid, Paper } from "@material-ui/core";
import { katakanaToRomaji } from "../jap-char";
import Signin from "../components/Signin";
import Register from "../components/Register";
import WordCard from "../components/WordCard";
import OutsideAlerter from "../components/OutsideAlerter";
import Footer from "../components/Footer";
import WelcomeBar from "../components/WelcomeBar";
import SmallCharList from "../components/SmallCharList";
import KatakanaChart from "../components/KatakanaChart";
import { Button } from "@material-ui/core";
import LoadingPopup from "../components/LoadingPopup"
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";

// dialog
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

import "../scss/containers/App.scss";
import {
  updateChar,
  updateWord,
  resetStore,
} from "../actions";
import {
  GETWORD_URL,
  UPDATECHARSCORE_URL,
  WORDSCORE_URL,
  MEDIA_BASE_URL_WORD,
} from "../constants";
import LogRocket from "logrocket";

// test introjs
import 'intro.js/introjs.css';
import { Steps, Hints } from 'intro.js-react';

LogRocket.init("zskhtw/japanese-learning");

const mapStateToProps = (state) => {
  return {
    currentJapChar: state.changeCardState.currentJapChar,
    onIncorrectCard: state.changeCardState.onIncorrectCard,
    curWrongChar: state.changeCardState.curWrongChar,
    onHintedCard: state.changeCardState.onHintedCard,
    wordCompleted: state.changeCardState.wordCompleted,
    currentWord: state.changeCardState.currentWord,
    audioIsPlaying: state.changeGeneralState.audioIsPlaying,
    romajiNotInDict: state.changeInputBox.romajiNotInDict,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setCurrentChar: (japchar, romaji) => {
      dispatch(updateChar(japchar, romaji));
    },
    updateWord: (word, romajiList) => {
      dispatch(updateWord(word, romajiList));
    },
    resetStore: () => {
      dispatch(resetStore());
    },
  };
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      route: "home", // should be register
      userInfo: {
        id: "a284d3ec-a941-4db0-acf2-b3531dab3f60",
        name: "newcomer",
        email: "newcomer@g.com",
        joined: "2020-10-14T19:27:16.707Z",
      },
      currentWordInfo: null,
      openEndDialogue: false,
      isFetchingWord: false,
      checkedAudioAutoPlay: false,

      // introjs test
      stepsEnabled: true,
      initialStep: 0,
      steps: [
        {
          intro: `Welcome to the walkthrough! Click 'Next' or use the right arrow key to continue.`,
        },
        {
          element: ".japanese-word",
          intro: "This is a Japanese word. The current character is highlighted in blue.",
          position: "left",
        },
        {
          element: ".main-button",
          intro: "Click it this button (or press spacebar) to learn the highlighted character",
          position: "left",
        },
        {
          element: ".hint-card",
          intro: "This is the Character Card. It shows the mnemonics for the highlighted character",
          position: "left",
        },
        {
          element: ".music-button",
          intro: "Click this to play the audio",
          position: "left",
        },
        {
          element: ".main-button",
          intro: "Click it this button again (or press spacebar) to move on. The character will be filled out for you",
          position: "left",
        },
        {
          element: ".inputbox-div",
          intro: "The previous character has been filled out for you. You can continue to type the next character without space if you know it. Otherwise, keep learning by clicking the main button",
          position: "left",
        },
        {
          element: ".audio-control",
          intro: "Toggle this switch to enable/disable audio autoplay.",
          position: "left",
        },
        {
          element: ".nav-button-progress",
          intro: "Click this tab to view your progress.",
          position: "bottom",
        },
        {
          element: ".nav-button-katakanaChart",
          intro: "Click this tab to check which Japanese character you have encoutered.",
          position: "bottom",
        },
      ]
    };
    this.charInputRef = React.createRef();
    this.hintCardRef = React.createRef();
  }

  componentDidMount = () => {
    this.requestNewWord(); // temporary
  };

  componentDidUpdate = (_, prevState) => {
    if (this.state.userInfo.id !== prevState.userInfo.id) {
      this.props.resetStore();
      this.requestNewWord();
    }

    if (this.state.route === "home") {
      setTimeout(() => {
        this.setState({ openEndDialogue: true });
      }, 60000 * 30);
    }
  };

  onRouteChange = (route) => {
    this.setState({ route: route });
  };

  parseJapaneseWord = (katakana_word) => {
    var charsToRead = [];
    for (const katakana_char of katakana_word) {
      var katakana_romaji = katakanaToRomaji[katakana_char] || "??";
      charsToRead.push({ 
        char: katakana_char, 
        romaji: katakana_romaji 
      });
    }
    return charsToRead;
  };

  updateCharScore = (user_uid, katakana_char, score) => {
    fetch(UPDATECHARSCORE_URL, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_uid: user_uid,
        char: katakana_char,
        score: score,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Update Char Score:", data);
      })
      .catch((error) => {
        console.log("Failed to update char score", error);
      });
  };

  updateWordScore = (user_uid, word) => {
    fetch(WORDSCORE_URL, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_uid: user_uid,
        word: word,
        unix_time: this.state.currentWord_unix_time,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Update Word Score:", data);
        // once score is updated, request new word
        this.requestNewWord();
      })
      .catch((error) => {
        console.log("Failed to update word score", error);
      });
  };

  parseAudio = (audio_string) => {
    return audio_string.slice(7, audio_string.length - 1);
  };

  requestNewWord = () => {
    const { setCurrentChar, updateWord } = this.props;
    var romajiList = [];
    this.setState({ clickedJapChar: "" });
    this.setState({ isFetchingWord: true })
    const wordRequestTime = Date.now();
    console.log("Word requested at time:", wordRequestTime)
    this.setState({ wordRequestTimeStamp: wordRequestTime})

    fetch(GETWORD_URL, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_uid: this.state.userInfo.id,
      }),
    })
      .then((res) => res.json())
      .then((word) => {
        this.setState({ isFetchingWord: false })

        romajiList = this.parseJapaneseWord(word.vocab_kana).map(
          (kana_char) => kana_char.romaji
        );
        updateWord(word.vocab_kana, romajiList);
        setCurrentChar(word.vocab_kana.charAt(0), romajiList[0]);

        this.setState({ currentWordInfo: word });
        this.setState({ currentWord_unix_time: Date.now() });

        const word_audio = new Audio(
          `${MEDIA_BASE_URL_WORD}
          ${this.parseAudio(word.vocab_sound_local)}`
        );
        word_audio.addEventListener("loadedmetadata", (event) => {
          this.setState({
            word_audio_duration: event.target.duration,
          });
        });
      })
      .catch((err) => {
        console.log("Error in getting next word", err);
      });
  };

  loadUser = (user) => {
    const { user_uid, name, email, joined } = user;
    this.setState((prevState) => {
      let userInfo = { ...prevState.userInfo };
      userInfo.name = name;
      userInfo.id = user_uid;
      userInfo.email = email;
      userInfo.joined = joined;
      return { userInfo };
    });

    LogRocket.identify(user_uid, {
      name: name,
      email: email,
      joined: joined,
    });

    console.log("userInfo", this.state.userInfo);
  };

  focusInputBox = () => {
    this.charInputRef.current.formRef.current.focus();
  };

  onClickCard = (event) => {
    const kana_char = event.target.innerText;
    this.setState({ clickedJapChar: kana_char });

    // unclick
    if (this.state.clickedJapChar === kana_char) {
      this.setState({ clickedJapChar: "" });
    }
  };

  showHint = () => {
    // once user completed word, can review hint card
    if (this.props.wordCompleted && this.state.clickedJapChar) {
      return (
        <Hint 
          currentHintedChar={this.state.clickedJapChar} 
          autoplayAudio={this.state.checkedAudioAutoPlay}
          ref={this.hintCardRef}
        />
      );
    }
    if (this.props.onHintedCard) {
      return (
        <Hint 
          currentHintedChar={this.props.currentJapChar} 
          autoplayAudio={this.state.checkedAudioAutoPlay}
          ref={this.hintCardRef}
        />
      );
    }
  };

  displayWordInfo = () => {
    if (this.props.wordCompleted) {
      return (
        <WordCard
          wordInfo={this.state.currentWordInfo}
          word_audio_duration={this.state.word_audio_duration}
          autoplayAudio={this.state.checkedAudioAutoPlay}
        />
      );
    }
  };

  getKeyByValue = (object, value) => {
    return Object.keys(object).find((key) => object[key] === value);
  };

  displayMessage = () => {
    const {
      onIncorrectCard,
      curWrongChar,
      wordCompleted,
      audioIsPlaying,
      romajiNotInDict,
      currentJapChar,
    } = this.props;
    if (audioIsPlaying) {
      return <div></div>;
    }
    if (onIncorrectCard) {
      return (
        <div>
          <p>
            <b>
              {romajiNotInDict
                ? `'${curWrongChar}' does not exist in the alphabet`
                : `'${curWrongChar}' corresponds to ${this.getKeyByValue(
                    katakanaToRomaji,
                    curWrongChar
                  )}, not ${currentJapChar}`}
            </b>
          </p>
        </div>
      );
    } else if (wordCompleted && !audioIsPlaying) {
      return (
        <div>
          <p>
            <b>{"Click on a card to view its mnemonic"}</b>
          </p>
        </div>
      );
    } else {
      return <p></p>;
    }
  };

  setButtonText = () => {
    const {
      onIncorrectCard,
      onHintedCard,
      wordCompleted,
      audioIsPlaying,
    } = this.props;

    if (onIncorrectCard) {
      return "Try Again";
    } else if (onHintedCard && !audioIsPlaying) {
      return "Got It";
    } else if (wordCompleted && !audioIsPlaying) {
      return " Next Word";
    } else if (!onHintedCard && !wordCompleted) {
      return "Learn Character";
    } else {
      return "";
    }
  };

  displayLoadingPopup = () => {
    console.log("Debug", this.state.isFetchingWord)
    if (this.state.isFetchingWord) {
      const curTime = Date.now()
      if (curTime - this.state.wordRequestTimeStamp > 1000) {
        console.log("word request is taking more than 1 sec")
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  handleAudioAutoplaySwitch = (event) => {
    console.log("event", event)
    console.log("event", event.target)
    console.log("event", event.target.name)
    console.log("event", event.target.checked)
    this.setState({ checkedAudioAutoPlay: !this.state.checkedAudioAutoPlay })
  }

  onExitIntro = () => {
    this.setState(() => ({ stepsEnabled: false }));
  }

  handleClickWalkthrough = () => {
    this.setState({ stepsEnabled: true });
  }

  onBeforeChange = (nextStepIndex) => {
    if (nextStepIndex) {
      // select dynamically created elements
      this.steps.updateStepElement(nextStepIndex);
    }

    if (nextStepIndex === 3) {
      if (!this.hintCardRef.current) {
        return false;
      } else {
        console.log("YES")
        this.steps.updateStepElement(nextStepIndex);
      }
    }
  }

  renderRoute = (route) => {
    switch (route) {
      case "progress":
        return (
          <div className="progress-flex-container">
            <div className="progress-flex-item1">
              <NavBar
                onRouteChange={this.onRouteChange}
                currentTab="progress"
              />
            </div>
            <div className="progress-flex-item2">
              <SmallCharList user_uid={this.state.userInfo.id} />
            </div>
            <Footer />
          </div>
        );
      case "katakanaChart":
        return (
          <div className="progress-flex-container">
            <div className="progress-flex-item1">
              <NavBar
                onRouteChange={this.onRouteChange}
                currentTab="katakanaChart"
              />
            </div>
            <div className="progress-flex-item2">
              <KatakanaChart user_uid={this.state.userInfo.id} />
            </div>
            <Footer />
          </div>
        )
      case "signin":
        return (
          <Signin onRouteChange={this.onRouteChange} loadUser={this.loadUser} />
        );
      case "register":
        return (
          <Register
            onRouteChange={this.onRouteChange}
            loadUser={this.loadUser}
          />
        );
      case "home":
        const { currentWord } = this.props;
        const {
          stepsEnabled,
          steps,
          initialStep
        } = this.state;

        return (
          <div className="page-container" style={{ position: "relative" }}>
            <LoadingPopup isOpen={this.displayLoadingPopup()}/>
            <Steps
              enabled={stepsEnabled}
              steps={steps}
              initialStep={initialStep}
              onExit={this.onExitIntro}
              options={{
                showStepNumbers: false,
                hidePrev: true,
                hideNext: true,
                exitOnOverlayClick: false,
              }}
              ref={steps => (this.steps = steps)}
              onBeforeChange={this.onBeforeChange}
            />
      
            <div className="content-wrap">
              <Dialog
                open={this.state.openEndDialogue}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
              >
                <DialogTitle id="alert-dialog-title">
                  {"Time's Up!"}
                </DialogTitle>
                <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                    <p>
                      You have used the app for 5 minute. Please click the link
                      below to take a short test that will access your Katakana
                      knowledge. Thank you for using the app!
                    </p>
                    <a
                      href="https://harvard.az1.qualtrics.com/jfe/form/SV_2aZI7SwLfhp5nxj"
                      className="survey-link"
                    >
                      https://harvard.az1.qualtrics.com/jfe/form/SV_2aZI7SwLfhp5nxj
                    </a>
                  </DialogContentText>
                </DialogContent>
              </Dialog>
              <NavBar 
                onRouteChange={this.onRouteChange} 
                currentTab="home"
                handleClickWalkthrough={this.handleClickWalkthrough}
              />
              <WelcomeBar
                className="introjs-step0-element" 
                userName={this.state.userInfo.name} 
              />
              <FormControlLabel
                className="audio-control"
                label="Autoplay Audio"
                labelPlacement="start"
                control={
                  <Switch 
                    checked={this.state.checkedAudioAutoPlay}
                    onChange={this.handleAudioAutoplaySwitch}
                    name="autoplay-audio" 
                    color="primary"
                  />
                }
              >
              </FormControlLabel>
              <Grid
                container
                direction="column"
                justify="center"
                alignItems="center"
              >
                <Paper elevation={0} />
                <OutsideAlerter focusInputBox={this.focusInputBox}>
                  <div className="inputbox-div">
                    <CharInput
                      updateCharScore={this.updateCharScore}
                      updateWordScore={this.updateWordScore}
                      getKeyByValue={this.getKeyByValue}
                      user_uid={this.state.userInfo.id}
                      ref={this.charInputRef}
                      setClick={(click) => (this.clickChild = click)}
                    />
                  </div>
                </OutsideAlerter>
                <Grid
                  container
                  direction="column"
                  justify="center"
                  alignItems="center"
                >
                  <Grid item>
                    <div className="introjs-step1-element" >
                      <CharList
                        charsToRead={this.parseJapaneseWord(currentWord)}
                        onClickCard={this.onClickCard}
                        clickedJapChar={this.state.clickedJapChar}
                      />
                    </div>
                    
                  </Grid>
                  <div>{this.displayMessage()}</div>
                  <Grid item>
                    {!this.props.audioIsPlaying ? (
                      <Button
                        className="main-button"
                        size="large"
                        variant="contained"
                        color="primary"
                        onClick={() =>
                          this.clickChild(
                            this.charInputRef.current.formRef.current
                          )
                        }
                        style={{ color: "white" }}
                      >
                        {this.setButtonText()}
                      </Button>
                    ) : (
                      <div></div>
                    )}
                  </Grid>

                  <Grid
                    container
                    direction="row"
                    justify="center"
                    alignItems="center"
                    spacing="2"
                  >
                    <Grid item>
                      <Paper elevation={1} />
                      {this.showHint()}
                    </Grid>
                    <Grid item>{this.displayWordInfo()}</Grid>
                  </Grid>
                </Grid>
              </Grid>
            </div>
            <Footer />
          </div>
        );
      default:
        return <div>Default</div>;
    }
  };

  render() {
    return <div className="tc">{this.renderRoute(this.state.route)}</div>;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
