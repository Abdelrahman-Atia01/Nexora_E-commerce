from PIL import Image, ImageDraw, ImageFont
import random
random.seed(4)
palette = [("#1b2420","#e9ece6"),("#24332d","#d9dfd7"),("#c9c4b8","#2b2f2c"),("#33413a","#f2f2ee"),("#3a2e2a","#efe3d8"),("#26323a","#dfe6ea")]
def tee(path, bg, fg, w=800, h=1000, label=""):
    im = Image.new("RGB",(w,h),bg); d = ImageDraw.Draw(im)
    d.polygon([(250,230),(340,200),(460,200),(550,230),(660,330),(590,400),(540,350),(540,780),(260,780),(260,350),(210,400),(140,330)], fill=fg)
    d.ellipse((340,170,460,260), fill=bg)
    im.save(path)
names = ["tee1","tee2","hoodie","jogger","cap","bag","watch","shoe","cat_men","cat_women","cat_acc","brand_a","tee3","tee4"]
for i,n in enumerate(names):
    bg,fg = palette[i%len(palette)]
    tee(f"img/{n}.png", bg, fg, *( (800,1000) if not n.startswith(("cat","brand")) else (800,800)))
    tee(f"img/{n}_b.png", fg, bg)
print("ok")
