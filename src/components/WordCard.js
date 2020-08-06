import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Music from "./Music";
import { MEDIA_BASE_URL_SENTENCE, MEDIA_BASE_URL_WORD } from "../constants";

const useStyles = makeStyles({
  root: {
    minWidth: 275,
  },
  bullet: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)",
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

export default function OutlinedCard({ wordInfo }) {
  const classes = useStyles();
  const bull = <span className={classes.bullet}>•</span>;

  const parseAudio = (audio_string) => {
    return audio_string.slice(7, audio_string.length - 1);
  };

  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography
          className={classes.title}
          color="textSecondary"
          gutterBottom
        >
          Word Meaning
        </Typography>
        <Typography variant="h5" component="h2">
          {wordInfo.vocab_meaning} ({wordInfo.vocab_pos})
          <Music
            audiofile={parseAudio(wordInfo.vocab_sound_local)}
            baseMediaUrl={MEDIA_BASE_URL_WORD}
          />
        </Typography>
        <br></br>
        <Typography
          className={classes.title}
          color="textSecondary"
          gutterBottom
        >
          Sample Sentence
        </Typography>
        <Typography variant="h5" component="h2">
          {wordInfo.sentence_kana}{" "}
          <Music
            audiofile={parseAudio(wordInfo.sentence_sound_local)}
            baseMediaUrl={MEDIA_BASE_URL_SENTENCE}
          />
        </Typography>
        <Typography
          className={classes.title}
          color="textSecondary"
          gutterBottom
        >
          Sentence Usage
        </Typography>
        <Typography variant="body2" component="p">
          {wordInfo.sentence_meaning}
        </Typography>
      </CardContent>
    </Card>
  );
}