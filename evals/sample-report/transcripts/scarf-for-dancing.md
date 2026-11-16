# A scarf for dancing

Result: pass

**system**
The child tapped their wand. The child's name is Freya. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Freya! I'm Glisten. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like dancing.

**assistant**
Would you like a scarf for dancing?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Scarf for dancing is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"scarf for dancing","reason":"You said you like dancing."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.
