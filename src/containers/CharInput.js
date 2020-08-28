import React from "react";
import { connect } from "react-redux";
import "../scss/containers/App.scss";
import { Input } from "@material-ui/core";
import SpellCheckerBuffer from "../inputChecker";
import { katakanaToRomaji } from "../jap-char";
import {
  pressKey,
  onCorrectChar,
  onIncorrectChar,
  typeAnswer,
  pressSpace,
  typeWrongAnswer,
  completeChar,
  pressEnter,
  updateChar,
  updateWord,
  completeWord,
  alertRomajiNotInDict,
  resetRomajiNotInDictAlert,
} from "../actions";

const mapStatestoProps = (state) => {
  return {
    indexCurrentCard: state.changeCardState.indexCurrentCard,
    romajiList: state.changeCardState.romajiList,
    cardStateList: state.changeCardState.cardStateList,
    curWrongChar: state.changeCardState.curWrongChar,
    onIncorrectCard: state.changeCardState.onIncorrectCard,
    wordCompleted: state.changeCardState.wordCompleted,
    onHintedCard: state.changeCardState.onHintedCard,
    currentRomaji: state.changeCardState.currentRomaji,
    currentWord: state.changeCardState.currentWord,
    charTimestamp: state.changeCardState.charTimestamp,
    audioIsPlaying: state.changeGeneralState.audioIsPlaying,
    inputBox: state.changeInputBox.inputBox,
  };
};
const mapDispatchToProps = (dispatch) => {
  return {
    onInputBoxChange: (event) => {
      dispatch(typeAnswer(event.target.value));
    },
    onKeyPress: (key) => {
      dispatch(pressKey(key));
    },
    onCorrectChar: () => {
      dispatch(onCorrectChar());
    },
    onIncorrectChar: () => {
      dispatch(onIncorrectChar());
    },
    onSpacePress: (context) => {
      dispatch(pressSpace(context));
    },
    onWrongInput: (userChar, currentChar) => {
      dispatch(typeWrongAnswer(userChar, currentChar));
    },
    onCompleteChar: (time, type) => {
      dispatch(completeChar(time, type));
    },
    onEnterPress: (time) => {
      dispatch(pressEnter(time));
    },
    setCurrentChar: (japchar, romaji) => {
      dispatch(updateChar(japchar, romaji));
    },
    updateWord: (word, romajiList) => {
      dispatch(updateWord(word, romajiList));
    },
    onWordCompletion: () => {
      dispatch(completeWord());
    },
    alertRomajiNotInDict: () => {
      dispatch(alertRomajiNotInDict());
    },
    resetRomajiNotInDictAlert: () => {
      dispatch(resetRomajiNotInDictAlert());
    },
  };
};

class CharInput extends React.Component {
  constructor(props) {
    super(props);
    this.formRef = React.createRef();
    this.inputChecker = new SpellCheckerBuffer(
      katakanaToRomaji,
      this.checkFunction,
      this.props.alertRomajiNotInDict
    );
  }

  componentDidMount() {
    const {
      setCurrentChar,
      romajiList,
      indexCurrentCard,
      currentWord,
    } = this.props;

    const curRomaji = romajiList[indexCurrentCard];
    const curKana = currentWord[indexCurrentCard];
    setCurrentChar(curKana, curRomaji);
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.user_uid === prevProps.user_uid) {
    }
  };

  convertTimeToScoreDelta = (charTimestamp) => {
    return charTimestamp.map((item) => {
      var score_delta = 20000 / item.time;
      if (item.type === "hinted") {
        score_delta *= -1;
      }
      return {
        char: item.char,
        score_delta: score_delta,
        result_type: item.type,
        result_time: item.time,
      };
    });
  };

  checkFunction = (char) => {
    const {
      romajiList,
      indexCurrentCard,
      onCorrectChar,
      onWrongInput,
      onWordCompletion,
      currentWord,
      setCurrentChar,
      onCompleteChar,
    } = this.props;
    console.log("checking", char);
    if (char === romajiList[indexCurrentCard]) {
      onCorrectChar();
      onCompleteChar(Date.now(), "correct");
      const newRomaji = romajiList[indexCurrentCard + 1];
      const newKana = currentWord[indexCurrentCard + 1];
      setCurrentChar(newKana, newRomaji);
      if (indexCurrentCard === romajiList.length - 1) {
        onWordCompletion();
      }
    } else {
      // onIncorrectChar();
      onWrongInput(char, romajiList[indexCurrentCard]);
    }
  };

  onKeyDown = (event) => {
    const {
      onIncorrectCard,
      curWrongChar,
      onInputBoxChange,
      onSpacePress,
      onCompleteChar,
      wordCompleted,
      onHintedCard,
      currentRomaji,
      onEnterPress,
      currentWord,
      romajiList,
      indexCurrentCard,
      setCurrentChar,
      charTimestamp,
      updateWord,
      updateCharScore,
      updateWordScore,
      onWordCompletion,
      audioIsPlaying,
      user_uid,
      cardStateList,
      resetRomajiNotInDictAlert,
    } = this.props;

    // disable input
    if (audioIsPlaying) {
      event.preventDefault();
      return;
    }

    if (wordCompleted) {
      event.preventDefault();
    }
    var lastCardState = cardStateList[cardStateList.length - 1];

    if (
      indexCurrentCard === romajiList.length - 1 &&
      (lastCardState === "correct" || lastCardState === "hinted")
    ) {
      onWordCompletion();
    }

    // keycode 65 to 90 represents a-z
    if (
      ((event.which >= 65 && event.which <= 90) || event.which === 222) &&
      !onIncorrectCard &&
      !wordCompleted &&
      !onHintedCard
    ) {
      var key =
        event.which === 222
          ? "'"
          : String.fromCharCode(event.which).toLowerCase();
      this.props.onKeyPress(key);
      this.inputChecker.checkInput(key);
    } else {
      event.preventDefault();

      // handle SPACE press
      if (event.which === 32) {
        if (onIncorrectCard) {
          // delete wrong input from inputBox
          event.target.value = event.target.value.slice(
            0,
            -curWrongChar.length
          );
          onInputBoxChange(event);
          onSpacePress("CONTINUE_AFTER_ERROR");
          resetRomajiNotInDictAlert();
        } else if (!onIncorrectCard && !onHintedCard && !wordCompleted) {
          // ask for hint
          onSpacePress("REQUEST_HINT");
          onCompleteChar(Date.now(), "hinted");

          // clear inputBox
          event.target.value = this.inputChecker.buffer.length
            ? event.target.value.slice(0, -this.inputChecker.buffer.length)
            : event.target.value;
          onInputBoxChange(event);

          // clear inputChecker buffer
          this.inputChecker.checkInput("clearBuffer");
        } else if (wordCompleted) {
          // move on to next word
          updateWord("", [""]);
          const scoreDeltaList = this.convertTimeToScoreDelta(charTimestamp);
          updateCharScore(user_uid, scoreDeltaList);
          updateWordScore(user_uid, currentWord);

          onSpacePress("CONTINUE_AFTER_COMPLETE");

          event.target.value = "";
          onInputBoxChange(event);
          const newRomaji = romajiList[0];
          const newKana = currentWord[0];
          setCurrentChar(newKana, newRomaji);
        }
      }

      // handle ENTER press
      if (event.which === 13) {
        if (onHintedCard) {
          if (indexCurrentCard === romajiList.length - 1) {
            onWordCompletion();
          }
          // autofill correct answer
          event.target.value = event.target.value.concat(currentRomaji);
          onInputBoxChange(event);
          onEnterPress(Date.now());

          const curRomaji = romajiList[indexCurrentCard + 1];
          const curKana = currentWord[indexCurrentCard + 1];
          setCurrentChar(curKana, curRomaji);
        }
      }
    }
  };

  render() {
    return (
      <form>
        <Input
          placeholder="Start typing here...."
          defaultValue={this.props.inputBox}
          inputProps={{ "aria-label": "description" }}
          onChange={this.props.onInputBoxChange}
          onKeyDown={this.onKeyDown}
          autoFocus
          inputRef={this.formRef}
          onPaste={(event) => {
            event.preventDefault();
          }}
        />
      </form>
    );
  }
}

export default connect(mapStatestoProps, mapDispatchToProps, null, {
  forwardRef: true,
})(CharInput);