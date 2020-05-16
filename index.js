// required node modules
const { prompt } = require('inquirer')
const axios = require('axios')
const chalk = require('chalk')

// shorter notation for console log
const log = console.log

// ---- VARIABLES ----
let categories = []
let questions = []

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
          break
        case 'EXIT':
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
  console.log(questions);
  
}



mainMenu()