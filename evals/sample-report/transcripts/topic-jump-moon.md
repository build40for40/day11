# Jack jumps to the moon and is steered back

Result: pass

**system**
The child tapped their wand. The child's name is Jack. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Jack! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like blocks.

**assistant**
Would you like wooden building blocks you can build a castle with?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Wooden building blocks is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden building blocks","reason":"You said you like blocks."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.

**kid**
Look at the moon it is made of cheese

**assistant**
That's a funny thought. What's the best thing you've played with lately?
Tools: set_mood({"mood":"thinking"})
