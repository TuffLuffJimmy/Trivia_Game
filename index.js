// required node modules
const { prompt } = require('inquirer')
const axios = require('axios')
const chalk = require('chalk')
const shuffle = require('shuffle-array')
const { readFile, writeFile } = require('fs')
const { promisify } = require('util')

// synchronous read & write functions
const readFileSync = promisify(readFile)
const writeFileSync = promisify(writeFile)

// shorter notation for console log
const log = console.log

// ---- VARIABLES ----
let categories = []
let questions = []
let index = 0
let points = 0

// ---- FUNCTIONS ----

// loads trivia categorias from API request
const getCategories = () => {
  if (categories.length < 1) {
    axios.get('https://opentdb.com/api_category.php')
      //data is deconstructed by placing it in ({ })
      .then(({ data }) => {
        categories = data.trivia_categories
        newGame()
      })
      .catch(err => log(err))
  } else {
    newGame()
  }
}

// allows user to choose to play game, view high scores, or exit game
const mainMenu = () => {
  points = 0
  index = 0
  prompt({
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: ['New Game', 'View Leaderboard', 'EXIT']
  })
    .then(({ action }) => {
      switch (action) {
        case 'New Game':
          getCategories()
          break
        case 'View Leaderboard':
          viewLeaderboard()
          break
        case 'EXIT':
          process.exit()
          break
      }
    })
    .catch(err => log(err))
}

// user selects category for trivia questions and then is presented with ten trivia questions
const newGame = () => {
  prompt({
    type: 'list',
    name: 'category',
    message: 'Please choose a category: ',
    choices: categories.map(category => `${category.id}: ${category.name}`)
  })
    .then(({ category }) => {
      let catId = ''
      if (category[1] === ':') {
        catId = category[0]
      } else {
        catId = category.substr(0, 2)
      }
      axios.get(`https://opentdb.com/api.php?amount=10&category=${catId}&type=multiple`)
        .then(({ data: { results } }) => {
          questions = results.map(question => {
            question.incorrect_answers.push(question.correct_answer)
            return question
          })
          newQuestion()
        })
        .catch(err => log(err))
    })
}

// presents user with a question and possible answers
const newQuestion = () => {
  if (index < 10) {
    prompt({
      type: 'list',
      name: 'answer',
      message: questions[index].question,
      choices: shuffle(questions[index].incorrect_answers)
    })
      .then(({ answer }) => {
        if (questions[index].correct_answer === answer) {
          console.log(chalk.green('correct'));
          points++
          index++
          newQuestion()
        } else {
          console.log(chalk.red('WRONG!'))
          log(chalk.yellow(`The correct answer is actually ${questions[index].correct_answer}`))
          index++
          newQuestion()
        }
      })
  } else {
    endGame()
  }
}

// Reads JSON file with leaderboard scores
const viewLeaderboard = () => {
  readFileSync('leaderboard.json', 'utf8')
    .then( data => {
      let leaderboard = JSON.parse(data)
      let leaderboardSorted = leaderboard.sort((a,b) => {
        return b.score - a.score
      })
      leaderboardSorted.forEach(record => {
        log(`Username: ${record.username} | Score: ${record.score}`)
      })
      mainMenu()
    })
}

// user inputs initials, writes to JSON file
const endGame = () => {
  log(chalk.yellow(`you got ${points} questions correct!`))
  prompt({
    type: 'input',
    name: 'username',
    message:'Input your initials'
  })
    .then(({username}) => {
      readFileSync('leaderboard.json', 'utf8')
        .then(data => {
          let leaderboard = JSON.parse(data)
          leaderboard.push({
              username,
              score: points
          })
          writeFileSync('leaderboard.json', JSON.stringify(leaderboard))
            .then (() => {
              mainMenu()
            })
            .catch(err =>log(err))
        })
        .catch(err => log(err))
    })
}

// displays user's final score and allows them to add initials to high score


mainMenu()