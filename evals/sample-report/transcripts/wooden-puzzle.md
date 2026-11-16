# A wooden puzzle

Result: pass

**system**
The child tapped their wand. The child's name is Ella. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Ella! I'm Glisten. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like puzzles.

**assistant**
Would you like a wooden puzzle?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Wooden puzzle is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden puzzle","reason":"You said you like puzzles."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.
