import java.awt.*;

public class Brick {

    private int x, y;
    private final int width = 50, height = 15;
    private boolean isVisible = true;
    private Color fillColor = Color.RED;
    private Color borderColor = Color.BLACK;

    public Brick(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public void draw(Graphics g) {
        if (isVisible) {
            g.setColor(fillColor);
            g.fillRect(x, y, width, height);
            g.setColor(borderColor);
            g.drawRect(x, y, width, height);  // Draw border
        }
    }

    public void hit() {
        isVisible = false;
    }

    public boolean isVisible() {
        return isVisible;
    }

    public Rectangle getBounds() {
        return new Rectangle(x, y, width, height);
    }
}
