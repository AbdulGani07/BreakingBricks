import java.awt.*;

public class Ball {

    private int x, y, dx = 1, dy = -1;
    private final int radius = 10;

    public Ball(int startX, int startY) {
        this.x = startX;
        this.y = startY;
    }

    public void move() {
        x += dx;
        y += dy;

        if (x <= 0 || x >= 590) {
            dx = -dx;
        }

        if (y <= 0) {
            dy = -dy;
        }

        if (y >= 390) {
            dy = -dy;
        }
    }

    public void increaseSpeed() {
        if (dx > 0) dx++;
        else dx--;
        
        if (dy > 0) dy++;
        else dy--;
    }

    public void draw(Graphics g) {
        g.setColor(Color.RED);
        g.fillOval(x, y, radius * 2, radius * 2);
    }

    public void bounceOffBrick() {
        dy = -dy;
        increaseSpeed();  // Increase speed after hitting a brick
    }

    public void bounceOffPaddle() {
        dy = -dy;
    }

    public Rectangle getBounds() {
        return new Rectangle(x, y, radius * 2, radius * 2);
    }

    public void resetPosition() {
        x = 300;
        y = 200;
        dx = 1;
        dy = -1;
    }

    public int getY() {
        return y;
    }
}
