

int main(){

    int a = 23;
    int b = 34;

    int c = a ? b ? 55 : 66 : 77;

    if (c == 55){
        c = 101;
    }
    else{
        c = 202;
    }


    return c;

}