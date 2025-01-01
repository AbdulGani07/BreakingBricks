# BreakingBricks Game

BreakingBricks is a classic arcade-style game inspired by the famous "Breakout" game. The game involves a paddle that moves across the screen to bounce a ball and break a series of bricks. Players aim to break all the bricks to score points while preventing the ball from falling off the screen. The game offers multiple levels, increasing difficulty, and various power-ups and bonuses for an engaging experience.

## Features

- **Paddle Movement**: The paddle can be controlled using the mouse or keyboard keys.
- **Bricks**: Multiple levels with different patterns of bricks to break.
- **Scoring**: Earn points by breaking bricks, with a score increment for each brick broken.
- **Levels**: The game starts at Level 1 and progresses up to Level 10, with increasing difficulty.
- **Ball Speed**: The ball's speed increases as more bricks are broken.
- **Lives**: The player has three lives. Losing all three lives ends the game and displays the score.
- **Power-Ups**: Some bricks contain power-ups, such as bonus points, additional balls, or extra lives.
- **Timer**: A countdown timer from 3 seconds before the game starts.

## Installation

To run the BreakingBricks game on your local machine, follow these steps:

### Prerequisites

- Java Development Kit (JDK) version 8 or higher is required to compile and run the game.
- A text editor or IDE (e.g., Visual Studio Code, IntelliJ IDEA, Eclipse) to edit the code.

### Steps to Run the Game

1. **Clone the Repository**:
   Clone this repository to your local machine using Git:

   ```bash
   git clone https://github.com/AbdulGani07/BreakingBricks.git
   ```

2. **Navigate to the Project Directory**:
   Open a terminal/command prompt and navigate to the directory where the project is cloned:

   ```bash
   cd BreakingBricks
   ```

3. **Compile the Java Files**:
   Compile all the `.java` files in the `src` folder:

   ```bash
   javac src/*.java
   ```

4. **Run the Game**:
   Run the game by executing the `App.java` class:

   ```bash
   java -cp src App
   ```

## Gameplay

1. The game starts with a countdown timer of 3 seconds: `3... 2... 1...`.
2. Use the mouse or arrow keys to control the paddle.
3. Your objective is to break all the bricks on the screen.
4. Each time the ball hits a brick, the player scores points.
5. After breaking all the bricks in a level, the game progresses to the next level with a new brick pattern.
6. If the ball falls off the screen, you lose one life. You have three lives in total.
7. Power-ups, such as additional lives or bonus points, will occasionally drop from bricks.

## Game Rules

- You start with 3 lives.
- Each brick gives 5 points.
- Losing all lives results in a "Game Over" screen with your final score.
- The ball's speed increases as the number of broken bricks increases.
- Some bricks contain special power-ups, such as:
  - **Extra Life**: Gain one additional life.
  - **Double Ball**: Split the ball into two balls.
  - **Bonus Points**: Score extra points.

## Levels

- The game starts at **Level 1** and goes up to **Level 10**.
- Each level has a different pattern of bricks, and the difficulty increases with more bricks and faster ball speed.

## Contributing

Contributions are welcome! If you'd like to contribute to the project, follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes with a meaningful message.
4. Push your branch and create a pull request.

## License

This project is licensed under the **Proprietary License**.

- You may use the code for personal, non-commercial purposes only.
- You may not modify, distribute, or sell the code without explicit permission from the author.
- For commercial use or redistribution, please contact me at abdulgani10525@gmail.com.
- All rights reserved.

For more details, please see the [LICENSE](LICENSE) file.


## Acknowledgments

- The concept of the game is inspired by the classic "Breakout" game.
- Special thanks to the open-source community for providing inspiration and code examples.
