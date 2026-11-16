# Bugs lead to a magnifying glass

Result: pass

**system**
The child tapped their wand. The child's name is Noah. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Noah! I'm Glisten. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like bugs.

**assistant**
Would you like a magnifying glass to look at bugs and leaves?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Magnifying glass is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"magnifying glass","reason":"You said you like looking closely."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.
