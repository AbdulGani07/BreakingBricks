import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.util.ArrayList;
import java.util.List;

public class BreakingBricks extends JPanel {

    private JFrame frame;
    private Paddle paddle;
    private Ball ball;
    private GameEngine engine;
    private List<Brick> bricks;
    private boolean gameStarted = false;
    private int countdown = 3;

    public BreakingBricks() {
        frame = new JFrame("Breaking Bricks Game");
        frame.setSize(600, 400);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        paddle = new Paddle(250, 350);
        ball = new Ball(300, 200);
        engine = new GameEngine(paddle, ball);

        bricks = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            for (int j = 0; j < 3; j++) {
                bricks.add(new Brick(60 * i + 30, 20 * j + 30));
            }
        }

        frame.add(this);
        this.setFocusable(true);
        this.addMouseMotionListener(new MouseMotionAdapter() {
            @Override
            public void mouseMoved(MouseEvent e) {
                paddle.moveTo(e.getX());
            }
        });

        this.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                if (!gameStarted) {
                    gameStarted = true;
                    startCountdown();
                }
            }
        });

        frame.setVisible(true);
    }

    public static void main(String[] args) {
        BreakingBricks game = new BreakingBricks();
        game.start();
    }

    public void start() {
        new Thread(() -> gameLoop()).start();
    }

    private void startCountdown() {
        new Thread(() -> {
            while (countdown > 0) {
                repaint();
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                countdown--;
            }
            engine.startGame();
        }).start();
    }

    public void gameLoop() {
        while (true) {
            if (gameStarted) {
                engine.update();
                checkCollisions();
                repaint();
            }
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        if (!gameStarted) {
            g.setColor(Color.BLACK);
            g.setFont(new Font("Arial", Font.BOLD, 30));
            g.drawString("Click to Start Game", 180, 150);
            g.setFont(new Font("Arial", Font.PLAIN, 20));
            g.drawString("Countdown: " + countdown, 250, 200);
        } else {
            paddle.draw(g);
            ball.draw(g);
            for (Brick brick : bricks) {
                brick.draw(g);
            }
            g.setColor(Color.BLACK);
            g.setFont(new Font("Arial", Font.PLAIN, 20));
            g.drawString("Score: " + engine.getScore(), 10, 30);
            g.drawString("Lives: " + engine.getLives(), 500, 30);
        }
    }

    private void checkCollisions() {
        for (Brick brick : bricks) {
            if (brick.isVisible() && ball.getBounds().intersects(brick.getBounds())) {
                brick.hit();
                ball.bounceOffBrick();
                engine.addScore(5);
            }
        }

        if (ball.getBounds().intersects(paddle.getBounds())) {
            ball.bounceOffPaddle();
        }

        if (ball.getY() > 390) {
            engine.loseLife();
        }
    }
}
