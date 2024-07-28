const vocabList = [];
let correctAnswers = {};
let percentComplete = 0;
let userLevel = 0;

export async function getVocabList() {
  if (vocabList.length === 0) {
    const text = await (await fetch("data/vocab.csv")).text();
    const data = text.split("\r\n").map((t) => t.split("\t"));
    const headers = data[0];
    for (let i = 1; i < data.length; i++) {
      const item = {};
      for (let j = 0; j < headers.length; j++) {
        item[headers[j].replace(" ", "")] = data[i][j];
      }
      vocabList.push(item);
    }
    vocabList.sort((a, b) => a.index - b.index);
  }
  return vocabList;
}

export function getIdFromWord(word) {
  return word.index + word.meaning + word.hiragana;
}

export function getCorrectAnswerCount(word) {
  if (!Object.keys(correctAnswers).length) {
    const answersText = localStorage.getItem("correctAns");
    if (answersText) {
      correctAnswers = JSON.parse(answersText);
    }
  }
  return Object.keys(correctAnswers).length
    ? correctAnswers[getIdFromWord(word)] || 0
    : 0;
}

export async function setCorrectAnswerCount(word, newCountOrAdd, isIncrement) {
  const prevCount = getCorrectAnswerCount(word); // read previous values from local storage
  const newCount = isIncrement ? newCountOrAdd + prevCount : newCountOrAdd;
  correctAnswers[getIdFromWord(word)] = newCount;
  reviseUserPercentComplete(word, newCount, prevCount);
  localStorage.setItem("correctAns", JSON.stringify(correctAnswers));
}

export function getMinCorrectAnswerThreshold(word) {
  return Math.ceil(2 * Math.log(word.level) + 2);
}

export async function getRandomQuestion() {
  const universe = 100;
  const randomNumber = Math.random();
  const list = await getVocabList();
  let answers = [];
  let chance = 0;
  for (const word of list) {
    if (!(await wordIsDone(word))) {
      chance += 1 / universe;
      if (randomNumber < chance) {
        // correct answer
        answers.push({ word: word, chance: randomNumber, correct: true });
        break;
      }
    }
  }

  // prepare wrong answers
  // get words of same level and set
  const wrongAnswers = list.filter(
    (wA) =>
      Number(wA.level) === Number(answers[0].word.level) &&
      Number(wA.set) === Number(answers[0].word.set)
  );
  answers = chooseRandomWords(3, wrongAnswers, answers);

  // format answers `meaning` and `correct`
  for (const answer of answers) {
    answer.word.meaningAll =
      answer.word.meaning +
      (answer.word.meaning2 ? `, ${answer.word.meaning2}` : "");
    answer.correct = answer.correct || false;
  }

  // order questions by random number
  answers.sort((a, b) => a.chance - b.chance);

  return answers;
}

export function chooseRandomWords(numberOfRandomChoice, wordsArray, result) {
  result = result || [];
  const chances = Array.from(Array(numberOfRandomChoice)).map((_) =>
    Math.random()
  );
  for (let i = 0; i < wordsArray.length; i++) {
    const thisChance = (i + 1) / wordsArray.length;
    for (let j = 0; j < chances.length; j++) {
      if (
        chances[j] !== null &&
        chances[j] < thisChance &&
        !result.some(
          (a) =>
            a.word.word === wordsArray[i].word ||
            a.word.meaning === wordsArray[i].meaning
        )
      ) {
        result.push({
          word: wordsArray[i],
          chance: chances[j],
        });
        chances[j] = null;
        break;
      }
    }
    if (chances.every((c) => c === null)) {
      break;
    }
  }
  return result;
}

export async function getUserPercentComplete() {
  if (percentComplete === 0 && userLevel === 0) {
    const list = await getVocabList();
    for (const word of list) {
      const nCorrectAnswer = getCorrectAnswerCount(word);
      const threshold = getMinCorrectAnswerThreshold(word);
      percentComplete += Math.min(1, nCorrectAnswer / threshold / list.length);

      if (await wordIsDone(word)) {
        updateUserLevel(word.level, list.length);
      }
    }
  }
  return { percentComplete, userLevel };
}

export async function reviseUserPercentComplete(
  word,
  newCorrectCount,
  prevCorrectCount
) {
  const list = await getVocabList();
  const threshold = getMinCorrectAnswerThreshold(word);
  percentComplete +=
    (newCorrectCount - prevCorrectCount) / threshold / list.length;

  return percentComplete;
}

export async function updateUserLevel(wordLevel, listLength) {
  listLength = listLength || (await getVocabList()).length;
  userLevel += (Number(wordLevel) / listLength) * 100;
}

export async function wordIsDone(word) {
  const nCorrectAnswer = getCorrectAnswerCount(word);

  const isWordDone = nCorrectAnswer >= getMinCorrectAnswerThreshold(word);
  return isWordDone;
}
