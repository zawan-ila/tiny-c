

int fib(int n){
    int a = 0;
    int b = 1;

    if (n == 0)
        return 0;
    if (n == 1)
        return 1;

    for(int num = 2; num <= n; num = num + 1){
        int c = a + b;
        a = b;
        b = c;
    }

    return b;
}


int main(){
    int n = 10;
    return fib(n);
}
