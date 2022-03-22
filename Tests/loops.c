

int GrayCode4(){

for(int a = 0; a < 2; a = a + 1){
    for (int b = 0; b < 2; b = b + 1){
        for (int c = 0; c <= 1; c = c + 1){
            for (int d = 0; d <= 1; d = d + 1){
                putchar(a + 48);
                putchar(b + 48);
                putchar(c + 48);
                putchar(d + 48);
                putchar(10);
            }
        }
    }
}


}


int main(){
    GrayCode4();
}
