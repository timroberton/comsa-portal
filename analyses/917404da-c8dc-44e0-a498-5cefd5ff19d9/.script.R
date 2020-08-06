a <- read.csv("tim.txt")

print("starting to wait")

Sys.sleep(1)

print("middle")

Sys.sleep(1)

print("finished waiting")

write.csv(a, "res_a.txt")
write.csv(a, "res_b.txt")