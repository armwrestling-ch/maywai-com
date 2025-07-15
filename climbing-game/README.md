# Climbing Game

A browser-based climbing game built with p5.js where players control a climber to reach the top hold.

## How to Play

1. Open `src/index.html` in your browser
2. Select a limb (left arm, right arm, left leg, right leg) using buttons or number keys (1-4)
3. Click on holds to move the selected limb
4. Use torso controls to push up (5), strafe left (6), strafe right (7), or relax (8)
5. Reach the golden top hold with both arms to win!

## Level Editor

Create your own custom climbing levels with the built-in level editor:

1. Open `src/level-editor.html` in your browser
2. Start by placing 4 starting holds at the bottom of the wall
3. Use mouse wheel to scroll up and down the level canvas
4. Add more holds as needed - they cannot be placed below the floor
5. Click "Place End Hold" to add the victory hold at the fixed position (200, 170)
6. Starting holds must be within reach of each other
7. Wall height grows automatically as you add holds higher up
8. Export your level as JSON or test it directly in the game

### Level Editor Features

- **Add Hold Mode (1)**: Click to place new holds anywhere above the floor
- **Remove Hold Mode (2)**: Click holds to remove them
- **Move Hold Mode (3)**: Drag holds to reposition them
- **Place End Hold Mode (4)**: Places the victory hold at the fixed top position
- **Mouse wheel scrolling**: Navigate up and down the level canvas
- **Real-time validation**: Starting holds are highlighted in red if invalid
- **Auto-growing canvas**: Wall height increases automatically as you build upward
- **Floor visualization**: Shows the floor boundary - holds cannot be placed below it
- **Export/Import**: Save and load levels as JSON files
- **Test Level**: Opens the game with your custom level

### Starting Hold Validation

- Arms have a reach of 80px
- Legs have a reach of 120px
- All starting holds must be reachable from the calculated torso position
- Invalid holds are highlighted with red circles

## Controls

### Game Controls

- **1-4**: Select limbs (left arm, right arm, left leg, right leg)
- **5 / Space**: Push torso up
- **6**: Strafe torso left
- **7**: Strafe torso right
- **8**: Relax torso to natural position

### Level Editor Controls

- **1**: Add Hold mode
- **2**: Remove Hold mode
- **3**: Move Hold mode
- **4**: Place End Hold mode
- **Mouse Wheel**: Scroll up/down the level canvas
- **T**: Test level
- **E**: Export level
- **C**: Clear level

## Technical Details

- Built with p5.js for canvas rendering
- Responsive design with CSS scaling
- Animation system with easing
- Physics-based limb reach validation
- LocalStorage for custom level testing

## Level Format

Custom levels are stored as JSON with this structure:

```json
{
  "name": "Level Name",
  "wallHeight": 1400,
  "holds": [
    { "x": 200, "y": 170, "top": true },
    { "x": 150, "y": 700 },
    { "x": 190, "y": 700 },
    { "x": 130, "y": 850 },
    { "x": 180, "y": 820 }
  ]
}
```
