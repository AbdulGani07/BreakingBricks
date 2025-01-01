import java.util.ArrayList;
import java.util.List;

public class GameEngine {

    private Paddle paddle;
    private Ball ball;
    private int score = 0;
    private int lives = 3;
    private int level = 1;
    private List<Brick> bricks;

    public GameEngine(Paddle paddle, Ball ball) {
        this.paddle = paddle;
        this.ball = ball;
        bricks = new ArrayList<>();
    }

    public void update() {
        ball.move();
        paddle.moveTo(paddle.getX()); // Update to the paddle's current position (move with keys or mouse)
    }

    public void startGame() {
        createBricksForLevel(level);
    }

    public void createBricksForLevel(int level) {
        bricks.clear();
        int numRows = 3 + level;
        int numCols = 5 + level;

        for (int i = 0; i < numCols; i++) {
            for (int j = 0; j < numRows; j++) {
                bricks.add(new Brick(60 * i + 30, 20 * j + 30));
            }
        }
    }

    public void nextLevel() {
        level++;
        createBricksForLevel(level);  // Create new bricks for the next level
    }

    public void addScore(int points) {
        score += points;
    }

    public int getScore() {
        return score;
    }

    public int getLives() {
        return lives;
    }

    public void loseLife() {
        lives--;
        if (lives == 0) {
            System.out.println("Game Over! Final Score: " + score);
        } else {
            ball.resetPosition();
        }
    }

    public List<Brick> getBricks() {
        return bricks;
    }
}
