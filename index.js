import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

const quizCategories = {'General Knowledge': 9, 'Books': 10, 'Music': 12, 'Video Games': 15, 'Nature': 17, 'Computers': 18, 'History': 23, 'Politics': 24, 'Animals': 27, 'Vehicles': 28, 'Gadgets': 30, 'Anime': 31};
const difficultyLevels = ['easy', 'medium', 'hard'];
const questionTypes = {'Multiple Choice': 'multiple', 'True or False': 'boolean'};
const numberOfQuestions = ['5', '10', '15', '20', '25', '30'];

// app.set('view engine', 'ejs');


app.get('/', async (req, res) => {
    res.render('index.ejs', {category: quizCategories, level: difficultyLevels, type: questionTypes, number: numberOfQuestions});


    // const quizCategories = "";
    // const difficultyLevels = "";
    // const questionTypes = "";
    // const questionNumbers = "";

});

app.post('/', async (req, res) => {

    const quizCategories = {'General Knowledge': 9, 'Books': 10, 'Music': 12, 'Video Games': 15, 'Nature': 17, 'Computers': 18, 'History': 23, 'Politics': 24, 'Animals': 27, 'Vehicles': 28, 'Gadgets': 30, 'Anime': 31};
    const difficultyLevels = ['easy', 'medium', 'hard'];
    const questionTypes = {'Multiple Choice': 'multiple', 'True or False': 'boolean'};
    const questionNumbers = ['5', '10', '15', '20', '25', '30'];


    try {

        const quizCategory = req.body.quizCategory;
        const difficultyLevel = req.body.difficultyLevel;
        const questionType = req.body.questionType;
        const numberOfQuestions = req.body.numberOfQuestions;

        const apiUrl = `https://opentdb.com/api.php?amount=${encodeURIComponent(numberOfQuestions)}&category=${encodeURIComponent(quizCategory)}&difficulty=${encodeURIComponent(difficultyLevel)}&type=${encodeURIComponent(questionType)}`

        const response = await axios.get(apiUrl);
        const result = response.data;
        console.log(result);

        if (result.response_code === 0) {

            res.render('index.ejs', { category: quizCategories, level: difficultyLevels, type: questionTypes, number: questionNumbers, data: result});

        } else if (result.response_code === 1) {

            res.render('index.ejs', { category: quizCategories, level: difficultyLevels, type: questionTypes, number: questionNumbers, error: 'No questions available for the selected criteria.' });

        }

    } catch (error) {
        console.error('Failed to make request:', error.message),
        res.render('index.ejs', {error: 'Failed to fetch data from API.'});
    }

    
})



app.listen(port, () => {
    console.log(`Server running on port: ${port}`)
});