import * as data from "./data.js";

async function initSettings() {
  await setPercentComplete();
  await fillTables();
}

async function setPercentComplete() {
  const { percentComplete, userLevel } = await data.getUserPercentComplete();
  $("#completeCounter").text(
    `${Math.round(percentComplete * 10000) / 100}% complete`
  );
  $("#userLevel").text(`Level ${Math.ceil(userLevel)}`);
  $(".points").show();
}

async function fillTables() {
  const list = await data.getVocabList();
  const rangeInterval = 1000;
  const indexRanges = {};
  const levels = {};

  for (let i = 0; i < list.length; i++) {
    const word = list[i];
    const nCorrectAnswer = data.getCorrectAnswerCount(word);
    const threshold = data.getMinCorrectAnswerThreshold(word);
    const wordIsDone = await data.wordIsDone(word, nCorrectAnswer, threshold);

    const indexMinRange = Math.floor(i / rangeInterval);
    const indexRange = `${indexMinRange * rangeInterval}-${(indexMinRange + 1) * rangeInterval}`;
    indexRanges[indexRange] = {
        nCorrect: (indexRanges[indexRange]?.nCorrect || 0) + nCorrectAnswer,
        totalCorrectNeeded: (indexRanges[indexRange]?.totalCorrectNeeded || 0) + threshold,
        wordsDone: (indexRanges[indexRange]?.wordsDone || 0) + (wordIsDone ? 1: 0),
        totalWords: (indexRanges[indexRange]?.totalWords || 0) + 1
    }

    levels[word.level] = {
        nCorrect: (levels[word.level]?.nCorrect || 0) + nCorrectAnswer,
        totalCorrectNeeded: (levels[word.level]?.totalCorrectNeeded || 0) + threshold,
        wordsDone: (levels[word.level]?.wordsDone || 0) + (wordIsDone ? 1: 0),
        totalWords: (levels[word.level]?.totalWords || 0) + 1
    }
  }

  let indexTableRows = "";
  for (const indexRange in indexRanges) {
    indexTableRows += `<tr>
        <td><span class="hide-for-large">Index range: </span>${indexRange}</td>
        <td><span class="hide-for-large">Progress to goal: </span>${Math.round(indexRanges[indexRange].nCorrect / indexRanges[indexRange].totalCorrectNeeded * 1000) / 10}%</td>
        <td><span class="hide-for-large">Words completed: </span>${indexRanges[indexRange].wordsDone} of ${indexRanges[indexRange].totalWords}</td></tr>`;
  }
  $("#byIndexTable tbody").html(indexTableRows);

  let levelTableRows = "";
  for (const level in levels) {
    levelTableRows += `<tr>
        <td><span class="hide-for-large">Level </span>${level}</td>
        <td><span class="hide-for-large">Progress to goal: </span>${Math.round(levels[level].nCorrect / levels[level].totalCorrectNeeded * 1000) / 10}%</td>
        <td><span class="hide-for-large">Words completed: </span>${levels[level].wordsDone} of ${levels[level].totalWords}</td></tr>`;
  }
  $("#byLevelTable tbody").html(levelTableRows);
}

initSettings();
