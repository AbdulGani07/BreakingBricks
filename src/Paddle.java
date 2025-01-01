import java.awt.*;

public class Paddle {
    private int x, y;
    private int width = 60;
    private int height = 10;
    private int speed = 10;

    public Paddle(int x, int y) {
        this.x = x;
        this.y = y;
    }

    // Method to move the paddle based on the mouse position
    public void moveTo(int mouseX) {
        this.x = mouseX - width / 2;  // Center the paddle at the mouse position
        if (this.x < 0) this.x = 0;
        if (this.x > 540) this.x = 540;  // Prevent paddle from going off the screen
    }

    // Getter method for x position
    public int getX() {
        return this.x;
    }

    // Getter method for y position
    public int getY() {
        return this.y;
    }

    // Method to draw the paddle
    public void draw(Graphics g) {
        g.setColor(Color.BLUE);
        g.fillRect(x, y, width, height);
    }

    // Method to get the bounds of the paddle (for collision detection)
    public Rectangle getBounds() {
        return new Rectangle(x, y, width, height);
    }
}
