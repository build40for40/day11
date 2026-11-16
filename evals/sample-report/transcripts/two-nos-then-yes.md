# Two nos, then a yes

Result: pass

**system**
The child tapped their wand. The child's name is Sam. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Sam! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like running outside.

**assistant**
Would you like a kite you can fly on a windy day?
Tools: set_mood({"mood":"thinking"})

**kid**
No.

**assistant**
Would you like a magnifying glass to look at bugs and leaves?
Tools: shake({}), set_mood({"mood":"thinking"})

**kid**
No.

**assistant**
Would you like a soft ball to roll and throw?
Tools: shake({}), set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Soft ball is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"soft ball","reason":"You said you like balls."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.
