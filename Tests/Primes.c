
int PrintNum(int n){
    if (n == 0)
        return;

    if (n < 0){
        putchar(45);
        PrintNum(-n);
    }
    else{
        PrintNum(n / 10);
        putchar(n % 10 + 48);
    }
}

int GetIntSqRoot(int n){
    int cand = 0;
    for(int num = 1; ; num = num + 1){
        if (! (num * num <= n))
            break;
        else
            cand = num;
    }

    return cand;
}

int IsPrime(int n){
    if (n <= 1 && n >= -1)
        return 0;
    
    if (n < 0)
        return IsPrime(-n);

    for(int div = 2; div <= GetIntSqRoot(n); div = div + 1){
        if (n % div == 0)
            return 0;
    }
    return 1;
}

int main(){
    
    for (int num = 1; num < 100; num = num + 1)
        if (IsPrime(num)){
            PrintNum(num);
            putchar(10);
        }

}